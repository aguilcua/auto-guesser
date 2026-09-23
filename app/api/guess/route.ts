import { NextResponse } from "next/server";
import { db } from "@/db";
import { eq, sql, asc } from "drizzle-orm";
import { cars, attributes, carAttributes, globalStats } from "@/db/schema";

export async function POST(request: Request) {
  try {
    //get user answers so far
    const body = await request.json();
    const { answers } = body;

    //fresh start
    const safeAnswers = answers || {};

    const allCars = await db.select().from(cars);
    const allMappings = await db.select().from(carAttributes);
    const allAttributes = await db // only get questions that are approved.
      .select()
      .from(attributes)
      .where(eq(attributes.isApproved, true))
      .orderBy(asc(attributes.id));

    const MATCH_MULTIPLIER = 1.4;
    const PENALTY_MULTIPLIER = 0.15; 

    let scoredCars = allCars.map((car) => {
      let probability = car.baseWeight; //start with baseline

      for (const [attributeId, userAnswer] of Object.entries(safeAnswers)) {
        const dbMapping = allMappings.find(
          (m) => m.carId === car.id && m.attributeId === attributeId,
        );
        
        if (userAnswer === null) continue;
        
        if (dbMapping) {
          const isCorrectMatch = dbMapping.isMatch === userAnswer;
          probability *= isCorrectMatch ? MATCH_MULTIPLIER : PENALTY_MULTIPLIER;
        } 
        // Unknowns implicitly multiply by 1.0 (no change)
      }
      
      return { ...car, probability: probability };
    });
    const totalScore = scoredCars.reduce(
      (sum, car) => sum + car.probability,
      0,
    );
    scoredCars = scoredCars.map((car) => ({
      ...car,
      probability: totalScore > 0 ? car.probability / totalScore : 0,
    }));
    //sort by highest prob
    scoredCars.sort((a, b) => b.probability - a.probability);

    let finalGuess = null;
    //determine next question
    const answeredAttributesIds = Object.keys(safeAnswers);
    const remainingAttributes = allAttributes.filter(
      (attr) => !answeredAttributesIds.includes(attr.id),
    );

    //contender pool
    let cumulativeProb = 0;
    const topContenders = [];
    
    for (const car of scoredCars) {
      topContenders.push(car);
      cumulativeProb += car.probability;
      if (cumulativeProb >= 0.95) break;
    }

    const totalContenders = topContenders.length;

    // Shannon Entropy
    const currentEntropy = scoredCars.reduce((sum, car) => {
      if (car.probability <= 0) return sum;
      return sum - (car.probability * Math.log2(car.probability));
    }, 0);

    const ENTROPY_THRESHOLD = 0.60; 

    //win condition
    if (scoredCars.length > 0 && currentEntropy < ENTROPY_THRESHOLD) {
      finalGuess = scoredCars[0];
    }

    // next question determination
    let bestQuestion = null;
    let bestScore = -1;

    if (!finalGuess && totalContenders > 0 && remainingAttributes.length > 0) {
      const totalProb = topContenders.reduce((sum, car) => sum + car.probability, 0);

      for (const attr of remainingAttributes) {
        let yesProb = 0;
        let mappedProb = 0;

        for (const car of topContenders) {
          const mapping = allMappings.find(
            (m) => m.carId === car.id && m.attributeId === attr.id,
          );

          if (mapping) {
            mappedProb += car.probability;
            if (mapping.isMatch) yesProb += car.probability;
          }
        }

        if (mappedProb < totalProb * 0.2) continue;

        const ratio = mappedProb > 0 ? yesProb / mappedProb : 0;
        const splitScore = 0.5 - Math.abs(ratio - 0.5);

        if (splitScore > bestScore) {
          bestScore = splitScore;
          bestQuestion = attr;
        }
      }
    }

    // Win Condition B: Knowledge Exhaustion 
    // If the best available question has a terrible split score (e.g., < 0.1),
    // the engine knows asking it won't help differentiate the remaining cars.
    if (!finalGuess && (!bestQuestion || bestScore < 0.1) && scoredCars.length > 0) {
      finalGuess = scoredCars[0];
    }
    // increment ask count for questions
    if (bestQuestion) {
      try {
        await db
          .update(attributes)
          .set({ askCount: sql`${attributes.askCount} + 1` })
          .where(eq(attributes.id, bestQuestion.id));
      } catch (error) {
        console.error("Failed to increase ask count", error);
      }
    }
    if (finalGuess) {
      try {
        const questionCount = Object.keys(answers).length;

        // increase guess count for picked vehicle
        await db
          .update(cars)
          .set({ guessCount: sql`${cars.guessCount} + 1` })
          .where(eq(cars.id, finalGuess.id));

        // grab current global distribution
        const statsRecords = await db.select().from(globalStats).limit(1);

        if (statsRecords.length > 0) {
          const currentStats = statsRecords[0];
          const distribution = (currentStats.gameLengthDistribution ||
            {}) as Record<string, number>;

          const countKey = questionCount.toString();
          distribution[countKey] = (distribution[countKey] || 0) + 1;

          // update games and json dist (short for distribution)
          await db
            .update(globalStats)
            .set({
              totalGamesPlayed: sql`${globalStats.totalGamesPlayed} + 1`,
              gameLengthDistribution: distribution,
            })
            .where(eq(globalStats.id, currentStats.id));
        }
      } catch (analyticsError) {
        console.error("Failed to record analytics telemetry:", analyticsError);
      }
    }

    //ADDITIONAL QUESTION STUFF
    let crowdSourceQuestion = null;
    if (finalGuess && remainingAttributes.length > 0) {
      const randIndex = Math.floor(Math.random() * remainingAttributes.length);
      crowdSourceQuestion = remainingAttributes[randIndex];
    }

    return NextResponse.json({
      success: true,
      topCars: scoredCars.slice(0, 5),
      nextQuestion: bestQuestion,
      finalGuess: finalGuess
        ? {
            id: finalGuess.id,
            make: finalGuess.make,
            model: finalGuess.model,
            probability: finalGuess.probability,
            guesses: (finalGuess.guessCount || 0) + 1,
          }
        : null,
      universeOfCars: allCars,
      crowdSourceQuestion: crowdSourceQuestion,
    });
  } catch (error) {
    console.error("Game engine error:", error);
    return NextResponse.json(
      { error: "Failed to process guess" },
      { status: 500 },
    );
  }
}
