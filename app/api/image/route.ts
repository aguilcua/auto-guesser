import { NextResponse } from "next/server";
import { db } from "@/db";
import { cars } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const carString = searchParams.get("query");
    const carId = searchParams.get("carId"); // Grab the ID we just added

    if (!carString) {
        return NextResponse.json({ error: "Missing car query" }, { status: 400 });
    }

    try {
        //if car is already in db, check if we have image cached to save on precious api calls.
        if (carId) {
            const existingCar = await db.select().from(cars).where(eq(cars.id, carId)).limit(1);
            if (existingCar.length > 0 && existingCar[0].imageUrl) {
                console.log(` CACHE HIT: Loaded saved image for ${carString}`);
                return NextResponse.json({ imageUrl: existingCar[0].imageUrl });
            }
        }

        // no cache... ask wikimedia my goat.
        const commonsUrl = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(carString)}&gsrnamespace=6&gsrlimit=1&prop=imageinfo&iiprop=url&format=json`;
        const response = await fetch(commonsUrl);
        const data = await response.json();

        //return null if nothing comes back from api query.
        if (!data.query || !data.query.pages) {
            return NextResponse.json({ imageUrl: null });
        }

        const pages = data.query.pages;
        const pageId = Object.keys(pages)[0];
        const pageData = pages[pageId];

        if (!pageData.imageinfo || !pageData.imageinfo[0].url) {
            return NextResponse.json({ imageUrl: null });
        }

        const imageUrl = pageData.imageinfo[0].url;
        console.log(`API HIT: Fetched new image for ${carString}`);

        // SAVE TO CACHE
        if (carId) {
            await db.update(cars).set({ imageUrl }).where(eq(cars.id, carId));
            console.log(` CACHE SAVED: Stored URL in database`);
        }
        
        return NextResponse.json({ imageUrl });

    } catch (error) {
        console.error("IMAGE GET ERROR:", error);
        return NextResponse.json({ imageUrl: null });
    }
}