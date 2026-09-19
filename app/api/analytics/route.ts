import { NextResponse } from "next/server";
import { db } from "@/db";
import { attributes, cars, globalStats } from "@/db/schema";
import { desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // get most guessed cars
    const topCars = await db
      .select({ make: cars.make, model: cars.model, guesses: cars.guessCount })
      .from(cars)
      .orderBy(desc(cars.guessCount))
      .limit(5);
    const topStumpedCars = await db.select({make: cars.make, model: cars.model, stumps: cars.stumpCount}).from(cars).orderBy(desc(cars.stumpCount)).limit(5);
    const topQuestions = await db.select({text: attributes.questionText, asks: attributes.askCount}).from(attributes).orderBy(desc(attributes.askCount)).limit(5);
    //  get the GD short for (Global Distributions)
    const stats = await db.select().from(globalStats).limit(1);
    const globalData = stats[0] || { totalGamesPlayed: 0, gameLengthDistribution: {} };

    // Push the (json) payload into array for recharts
    const rawDistribution = globalData.gameLengthDistribution as Record<string, number>;
    const distributionChartData = Object.keys(rawDistribution)
      .map(key => ({
        questions: parseInt(key),
        frequency: rawDistribution[key]
      }))
      .sort((a, b) => a.questions - b.questions);

    return NextResponse.json({
      topCars,
      topStumpedCars,
      topQuestions,
      totalGames: globalData.totalGamesPlayed,
      distributionChartData,
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}