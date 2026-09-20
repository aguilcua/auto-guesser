import { NextResponse } from "next/server";
import { db } from "@/db";
import { pendingVotes, carAttributes } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";

export async function POST(request: Request) {
  try {
    const { carId, attributeId, isMatch } = await request.json();
    if (!carId || !attributeId || typeof isMatch !== "boolean") {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }
    await db
      .insert(pendingVotes)
      .values({
        carId,
        attributeId,
        yesVotes: isMatch ? 1 : 0,
        noVotes: isMatch ? 0 : 1,
      })
      .onConflictDoUpdate({
        target: [pendingVotes.carId, pendingVotes.attributeId],
        set: {
          yesVotes: sql`${pendingVotes.yesVotes} +${isMatch ? 1 : 0}`,
          noVotes: sql`${pendingVotes.noVotes} +${!isMatch ? 1 : 0}`,
        },
      });

      const [currentTally] = await db
      .select()
      .from(pendingVotes)
      .where(
        and(eq(pendingVotes.carId, carId), eq(pendingVotes.attributeId, attributeId))
      );
      const CONSENSUS_THRESHOLD = 3;
      if ( currentTally.yesVotes >= CONSENSUS_THRESHOLD || currentTally.noVotes >= CONSENSUS_THRESHOLD) {
        const final_decision = currentTally.yesVotes >= CONSENSUS_THRESHOLD;

        await db
        .insert(carAttributes)
        .values({
          carId,
          attributeId,
          isMatch: final_decision,
        })
        .onConflictDoNothing();

        await db
        .delete(pendingVotes)
        .where(
          and(eq(pendingVotes.carId, carId), eq(pendingVotes.attributeId, attributeId))
        );
      }
      return NextResponse.json({success: true});
      
  } catch (e) {
    console.error("Failed to process vote", e);
    return NextResponse.json({error: "internal server error"}, {status: 500});
  }
}
