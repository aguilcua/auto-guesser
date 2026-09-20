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
      .where(eq(attributes.isApproved, true)). orderBy(asc(attributes.id));

    //naive bayes math
    const MATCH_MULTIPLIER = 2.0;
    const PENALTY_MULTIPLIER = 0.05;

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
        } else {
          continue; // if a car does not have a mapping for the new question just continue.
        }
      }
      return { ...car, probability: probability };
    });
    const totalScore = scoredCars.reduce((sum, car) => sum + car.probability, 0)
    scoredCars = scoredCars.map(car => ({
      ...car, probability: totalScore > 0 ? car.probability / totalScore : 0
    }));
    //sort by highest prob
    scoredCars.sort((a, b) => b.probability - a.probability);

    // win condition
    let finalGuess = null;

    // Check if the #1 car has a higher chance than car #2
    if (scoredCars.length >= 2) {
      const topCar = scoredCars[0];
      const runnerUp = scoredCars[1];

      // If the top car's probability is more than double the runner up,
      // the engine is confident enough to make a final guess.
      if (topCar.probability > runnerUp.probability * 2) {
        finalGuess = topCar;
      }
    }
    //determine next question
    const answeredAttributesIds = Object.keys(safeAnswers);
    const remainingAttributes = allAttributes.filter(
      (attr) => !answeredAttributesIds.includes(attr.id)
    );

    const topContenders = scoredCars.slice(0, 20);
    const totalContenders = topContenders.length;

    let bestQuestion = null;
    let bestScore = -1;
  

    if (!finalGuess && totalContenders > 0 && remainingAttributes.length > 0) {
      for (const attr of remainingAttributes) {
        let yesCount = 0;
        for (const car of topContenders) {
          const mapping = allMappings.find(
            (m) => m.carId === car.id && m.attributeId === attr.id,
          );
          if (mapping?.isMatch) yesCount++;
        }

        const ratio = yesCount / totalContenders;
        const splitScore = 0.5 - Math.abs(ratio - 0.5);

        if (splitScore > bestScore) {
          bestScore = splitScore;
          bestQuestion = attr;
        }
      }
    }

    // if no remaining questions then pick the most likely.
    if (
      !finalGuess &&
      remainingAttributes.length === 0 &&
      scoredCars.length > 0
    ) {
      finalGuess = scoredCars[0];
    } 
    // increment ask count for questions
    if(bestQuestion) {
      try {
        await db.update(attributes).set({askCount: sql`${attributes.askCount} + 1`}).where(eq(attributes.id, bestQuestion.id));
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
          const distribution = (currentStats.gameLengthDistribution || {}) as Record<string, number>;
          
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
      finalGuess: finalGuess,
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
