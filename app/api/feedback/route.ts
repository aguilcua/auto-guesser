import { NextResponse } from "next/server";
import { db } from "@/db";
import {sql, eq} from "drizzle-orm";
import { cars, attributes, carAttributes } from "@/db/schema";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userCarString, newQuestionText, category, engineGuessId } = body;

    // 1. Check if the user car already exists
    const allCars = await db.select().from(cars);
    const existingCar = allCars.find(c => `${c.make} ${c.model}` === userCarString);

    let actualCarId;

    if (existingCar) {
      actualCarId = existingCar.id;
    } else {
      // If its a new custom car, split the string into make and model
      const parts = userCarString.trim().split(" ");
      const make = parts[0];
      const model = parts.slice(1).join(" ") || "Custom";
      
      const [insertedCar] = await db.insert(cars).values({
        make,
        model,
        startYear: 2024,
        baseWeight: 1,
      }).returning(); // use returning to get ID back.
      
      actualCarId = insertedCar.id;
    }

    // add distinguishing question to question list
    const [newQuestion] = await db.insert(attributes).values({
      questionText: newQuestionText,
      category: category as any,
    }).returning(); 

    //  map the question to both cars in prep for next play
    await db.insert(carAttributes).values([
      { carId: actualCarId, attributeId: newQuestion.id, isMatch: true },
      { carId: engineGuessId, attributeId: newQuestion.id, isMatch: false }
    ]);
    try {
      await db.update(cars).set({stumpCount: sql`${cars.stumpCount} + 1`}).where(eq(cars.id, actualCarId));
    } catch (error) {
      console.error("failed to update stump count", error);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Feedback error:", error);
    return NextResponse.json({ error: "Failed to save feedback" }, { status: 500 });
  }
}