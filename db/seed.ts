import { db } from "./index";
import { cars, attributes, carAttributes, globalStats } from "./schema";

async function main() {
  console.log(" Clearing old data...");
  await db.delete(carAttributes);
  await db.delete(cars);
  await db.delete(attributes);
  await db.delete(globalStats);

  
  console.log(" Seeding Questions...");
  //questions are defined using a key to be used later
  const questionData = [
    // DRIVETRAIN
    { key: "fwd", text: "Is it Front-Wheel Drive (FWD)?", category: "drivetrain" },
    { key: "rwd", text: "Is it Rear-Wheel Drive (RWD)?", category: "drivetrain" },
    { key: "awd", text: "Is it All-Wheel Drive (AWD)?", category: "drivetrain" },
    { key: "manual", text: "Did it come with a manual transmission?", category: "drivetrain" },
    { key: "factory_lsd", text: "Does it come standard with a factory mechanical limited-slip differential?", category: "drivetrain" },
    //  ENGINE
    { key: "v8", text: "Does it have a V8 engine?", category: "engine" },
    { key: "turbo", text: "Is it turbocharged or supercharged?", category: "engine" },
    { key: "ev", text: "Is it fully electric (EV)?", category: "engine" },
    { key: "h_series", text: "Does it come with an H-series engine?", category: "engine" },
    { key: "mid_engine", text: "Is the car mid-engine?", category: "engine" },
    { key: "hybrid", text: "Is it a hybrid?", category: "engine" },
    { key: "boxer", text: "Does it have a boxer engine?", category: "engine" },
    { key: "v6", text: "Is there a V6 under the hood?", category: "engine" },
    { key: "inline6", text: "Does it have an inline-six engine?", category: "engine" },
    { key: "big_cyl", text: "Does it have more than eight cylinders?", category: "engine" },
    { key: "rotary", text: "Does its engine spin in a triangle instead of using pistons?", category: "engine" },
    { key: "twin_turbo", text: "Does it breathe through two turbochargers?", category: "engine" },
    { key: "rear_engine", text: "Is the engine mounted behind the rear axle?", category: "engine" },
    { key: "redline_8k", text: "Does its engine have a redline of 8,000 RPM or higher?", category: "engine" },
    { key: "over_400hp", text: "Does it make more than 400 horsepower from the factory?", category: "engine" },

    //  BODY / SILHOUETTE
    { key: "coupe", text: "Does it have 2 doors?", category: "body_style" },
    { key: "sedan", text: "Is it a 4-door Sedan?", category: "body_style" },
    { key: "2+2", text: "Does it have a 2+2 seating layout? (2 front seats, 2 smaller rear seats)", category: "body_style" },
    { key: "hatchback", text: "Is it a hatchback?", category: "body_style" },
    { key: "liftback", text: "Is it a lift back?", category: "body_style"},
    { key: "convertible", text: "Can you take the roof off, or fold it away?", category: "body_style" },
    { key: "two_seater", text: "is it a two-seater? (no rear seats)", category: "body_style" },
    { key: "boxy", text: "Are its sides and rear end nearly flat and vertical, like a box?", category: "body_style" },
    { key: "wedge", text: "Does its body slope in one straight line from a low nose up toward the tail?", category: "body_style" },
    { key: "truck", text: "Is it a pickup truck?", category: "body_style" },
    { key: "suv", text: "Is it an SUV or off-road vehicle?", category: "body_style" },

    //  DESIGN DETAILS
    { key: "unusual_doors", text: "Do its doors open upward or in some non-standard way (scissor, gullwing, rear-hinged)?", category: "design" },
    { key: "big_wing", text: "Does it come from the factory with a raised rear wing on uprights, not just a lip spoiler?", category: "design" },
    { key: "popups", text: "Does it have pop-up headlights?", category: "design" },
    { key: "round_taillights", text: "Are the taillights round?", category: "design" },
    { key: "tri_bar_taillights", text: "Does it have three vertical bar taillight segments on each side?", category: "design" },
    { key: "led_boomerang_taillights", text: "Does it have boomerang-shaped taillights?", category: "design" },
    { key: "flared_arches", text: "Does it have flared wheel arches or a wide-body kit compared to its base model?", category: "design" },
    { key: "digital_gauge_display", text: "Does it have a factory multi-function display (MFD) built into the center dash?", category: "design" },
    { key: "fold_flat_windshield", text: "Does it have a factory fold-flat windshield option?", category: "design" },

    // ORIGIN / MARKET
    { key: "japanese", text: "Is the manufacturer Japanese?", category: "origin" },
    { key: "american", text: "Is the manufacturer American?", category: "origin" },
    { key: "european", text: "Is the manufacturer European?", category: "origin" },
    { key: "german", text: "Does it come from the land of the autobahn?", category: "origin" },
    { key: "italian", text: "Does it come from the land of pasta and prancing horses?", category: "origin" },
    { key: "british", text: "Is the car Bri'ish?", category: "origin" },
    // { key: "Australia", text: "Does it come from land down under?", category: "origin" },
    { key: "us_market", text: "Could you have walked into a US dealership and bought one brand new?", category: "origin" },

    // ERA & FACTS (era tags are derived from the year field)
    { key: "pre_1980", text: "Was production started before 1980?", category: "character" },
    { key: "pre_2000", text: "Was production started before 2000?", category: "character" },
    { key: "pre_2010", text: "Was production started before 2010?", category: "character" },
    { key: "post_2015", text: "Did production start after 2015?", category: "character" },
    { key: "post_2020", text: "Did production start in 2020 or later?", category: "character" },
    { key: "lightweight", text: "Does it weigh under 2,500 lb (1,130 kg)?", category: "character" },
    { key: "six_figure", text: "Did it have a sticker price over $100,000 when new (not adjusted for inflation)?", category: "character" },
    { key: "limited_run", text: "Were fewer than 10,000 of them ever built?", category: "character" },
    { key: "wrc", text: "Did the manufacturer enter a version of it in the World Rally Championship?", category: "character" },

    // POP CULTURE
    { key: "james_bond", text: "Has a fictional spy driven one?", category: "pop_culture" },
    { key: "knight_rider", text: "Was it a TV star that could talk back to its driver?", category: "pop_culture" },
    { key: "dicaprio", text:"Was it destroyed on set during the filming of The Wolf of Wall Street?", category: "pop_culture"},
    { key: "fast_furious", text: "Is it famously featured in the Fast & Furious movies?", category: "pop_culture" },
    { key: "initial_d", text: "Is it famously featured in Initial D?", category: "pop_culture" },
    { key: "back_to_the_future", text: "Is it used as a time machine?", category: "pop_culture" },
    { key: "senna", text: "Was the development of this car influenced by Ayrton Senna?", category: "pop_culture" },
    { key: "godzilla", text: "Is it usually nicknamed godzilla?", category: "pop_culture" },
    { key: "bmw_toyota", text: "Is it a BMW in disguise?", category: "pop_culture" },
    { key: "herbie", text: "Does it take the name of Herbie in a disney movie?", category: "pop_culture" },
    { key: "bueller", text: "Bueller...Bueller...Bueller?", category: "pop_culture" },
  ];

  // Insert questions and keep track of their generated database IDs
  const dbQuestions = await db.insert(attributes).values(
    questionData.map(q => ({
      questionText: q.text,
      category: q.category as any,
      isApproved: true
    }))
  ).returning();

  // Create a map to easily look up a question's DB ID by its shorthand key
  const qMap = new Map<string, any>();
  questionData.forEach((q, index) => qMap.set(q.key, dbQuestions[index].id));

  // manually added tags to cars for initial seeding
  // IF IT HAS A // THAT MEANS I ALREADY TESTED FOR IMAGE FETCHING AND DIFFERENTIATION FROM OTHER CARS.
  console.log("Seeding Cars...");
  const carRoster = [
    // JAPANESE
    { make: "Honda", model: "Prelude BB6", year: 1998, tags: ["fwd", "manual", "coupe", "2+2", "japanese", "h_series", "us_market"] },
    { make: "Honda", model: "S2000 AP1", year: 1999, tags: ["rwd", "manual", "convertible", "japanese", "fast_furious", "two_seater", "redline_8k", "us_market"] },
    { make: "Honda", model: "Civic Type R FL5", year: 2023, tags: ["fwd", "manual", "turbo", "hatchback", "japanese", "big_wing", "us_market"] },
    { make: "Honda", model: "Civic Type R EK9", year: 1998, tags: ["fwd", "manual", "hatchback", "japanese", "redline_8k", "lightweight", "big_wing"] },
    { make: "Honda", model: "NSX NA1", year: 1990, tags: ["rwd", "manual", "v6", "coupe", "japanese", "senna", "popups", "mid_engine", "two_seater", "wedge", "redline_8k", "us_market"] },
    { make: "Honda", model: "NSX NC1", year: 2016, tags: ["awd", "turbo", "twin_turbo", "v6", "hybrid", "coupe", "japanese", "mid_engine", "two_seater", "six_figure", "over_400hp", "us_market"] },
    { make: "Acura", model: "Integra Type-R DC2", year: 1995, tags: ["fwd", "manual", "liftback", "japanese", "us_market", "redline_8k", "lightweight", "big_wing"] },
    { make: "Acura", model: "RSX Type-S DC5", year: 2006, tags: ["fwd", "manual", "liftback", "japanese", "us_market", "redline_8k"] },
    { make: "Toyota", model: "Supra MK4", year: 1998, tags: ["rwd", "manual", "turbo", "twin_turbo", "inline6", "coupe", "japanese", "fast_furious", "round_taillights", "big_wing", "us_market", "2+2"] },
    { make: "Toyota", model: "Supra MK5", year: 2019, tags: ["rwd", "liftback", "manual", "turbo", "inline6", "coupe", "japanese", "bmw_toyota", "two_seater", "us_market"] },
    { make: "Toyota", model: "GR86 ZN8", year: 2022, tags: ["rwd", "manual", "coupe", "japanese", "boxer", "us_market", "2+2", "lightweight"] },
    { make: "Toyota", model: "MR2 SW20", year: 1991, tags: ["rwd", "manual", "turbo", "coupe", "japanese", "mid_engine", "popups", "two_seater", "wedge", "us_market"] },
    { make: "Toyota", model: "MR2 SW20", year: 1991, tags: ["rwd", "manual", "coupe", "japanese", "mid_engine", "popups", "two_seater", "wedge", "us_market"] },
    { make: "Nissan", model: "Skyline GT-R R34", year: 1999, tags: ["awd", "2+2", "manual", "turbo", "twin_turbo", "inline6", "coupe", "japanese", "fast_furious", "round_taillights", "big_wing", "digital_gauge_display"] },
    { make: "Nissan", model: "Skyline R33", year: 1995, tags: ["awd", "2+2", "manual", "turbo", "twin_turbo", "inline6", "coupe", "japanese", "fast_furious", "round_taillights", "big_wing"] },
    { make: "Nissan", model: "Skyline GT-R R32", year: 1989, tags: ["awd", "2+2", "manual", "turbo", "twin_turbo", "inline6", "coupe", "japanese", "initial_d", "godzilla", "big_wing", "round_taillights"] },
    { make: "Nissan", model: "GT-R R35", year: 2020, tags: ["awd", "2+2", "turbo", "twin_turbo", "v6", "coupe", "japanese", "six_figure", "over_400hp", "us_market", "round_taillights"] },
    { make: "Nissan", model: "Z NISMO RZ34", year: 2023, tags: ["rwd", "manual", "liftback", "turbo", "twin_turbo", "v6", "coupe", "japanese", "two_seater", "over_400hp", "us_market"] },
    { make: "Nissan", model: "180SX RPS13", year: 1991, tags: ["rwd", "2+2", "manual", "turbo", "liftback", "coupe", "japanese", "popups", "initial_d"] },
    { make: "Nissan", model: "Silvia S13", year: 1991, tags: ["rwd", "2+2", "manual", "turbo", "coupe", "japanese", "boxy", "initial_d"] },
    { make: "Nissan", model: "Silvia Spec-R S15", year: 1999, tags: ["rwd", "2+2", "manual", "turbo", "coupe", "japanese", "fast_furious"] },
    { make: "Nissan", model: "Altima SR L34", year: 2018, tags: ["sedan", "japanese", "awd", "us_market"] },
    { make: "Mazda", model: "RX-7 FD USDM", year: 1993, tags: ["rwd", "manual", "turbo", "twin_turbo", "rotary", "coupe", "japanese", "popups", "fast_furious", "initial_d", "two_seater", "round_taillights", "redline_8k", "us_market"] },
    { make: "Mazda", model: "RX-8", year: 2004, tags: ["rwd", "2+2", "manual", "rotary", "coupe", "japanese", "unusual_doors", "redline_8k", "us_market", "fast_furious"] },
    { make: "Mazda", model: "MX-5 Miata NA", year: 1990, tags: ["rwd", "manual", "convertible", "japanese", "popups", "two_seater", "lightweight", "us_market"] },
    { make: "Mazda", model: "MX-5 Miata ND", year: 2023, tags: ["rwd", "manual", "convertible", "japanese", "two_seater", "us_market", "lightweight"] },
    { make: "Subaru", model: "WRX STI GD", year: 2004, tags: ["awd", "manual", "turbo", "sedan", "japanese", "boxer", "big_wing", "wrc", "us_market"] },
    { make: "Subaru", model: "WRX VB", year: 2022, tags: ["awd", "manual", "turbo", "sedan", "japanese", "boxer", "us_market"] },
    { make: "Mitsubishi", model: "Lancer Evolution VIII", year: 2004, tags: ["awd", "manual", "turbo", "sedan", "japanese", "fast_furious", "big_wing", "wrc", "us_market"] },
    { make: "Toyota", model: "Sprinter Trueno (AE86)", year: 1985, tags: ["rwd", "2+2", "manual", "liftback", "japanese", "popups", "initial_d", "lightweight"] },
    { make: "Toyota", model: "Celica GT-Four (ST205)", year: 1994, tags: ["awd", "2+2", "manual", "turbo", "liftback", "coupe", "japanese", "wrc"] },
    { make: "Toyota", model: "GR Corolla", year: 2023, tags: ["awd", "manual", "turbo", "hatchback", "japanese", "us_market"] },
    { make: "Nissan", model: "350Z", year: 2006, tags: ["rwd", "manual", "v6", "coupe", "liftback", "japanese", "fast_furious", "two_seater", "us_market"] },
    { make: "Nissan", model: "G35", year: 2006, tags: ["rwd", "manual", "v6", "coupe", "japanese", "2+2", "us_market"] },
    { make: "Nissan", model: "370Z Z34", year: 2009, tags: ["rwd", "manual", "v6", "coupe", "liftback", "japanese", "fast_furious", "two_seater", "us_market", "led_boomerang_taillights"] },
    { make: "Lexus", model: "LFA", year: 2011, tags: ["rwd", "big_cyl", "coupe", "japanese", "two_seater", "redline_8k", "six_figure", "limited_run", "over_400hp", "us_market"] },
    { make: "Toyota", model: "Prius XW60", year: 2024, tags: ["fwd", "hatchback", "hybrid", "japanese", "us_market"] },
    { make: "Toyota", model: "Land Cruiser J80", year: 1991, tags: ["awd", "manual", "suv", "japanese", "boxy", "us_market"] },
    { make: "Toyota", model: "Tacoma xtracab", year: 1988, tags: ["awd", "manual", "truck", "japanese", "us_market"] },

    // AMERICAN & TRUCKS HELL YA BROTHER
    { make: "Ford", model: "Mustang S650", year: 2024, tags: ["rwd", "manual", "v8", "coupe", "american", "over_400hp", "us_market", "2+2", "tri_bar_taillights"] },
    { make: "Ford", model: "Mustang S550", year: 2016, tags: ["rwd", "manual", "v8", "coupe", "american", "over_400hp", "us_market", "2+2", "tri_bar_taillights"] },
    { make: "Ford", model: "Mustang S197", year: 2012, tags: ["rwd", "manual", "v8", "coupe", "american", "over_400hp", "us_market", "2+2", "tri_bar_taillights"] },
    { make: "Ford", model: "Mustang Foxbody", year: 1989, tags: ["rwd", "manual", "v8", "coupe", "american", "boxy", "us_market", "2+2", "tri_bar_taillights"] },
    { make: "Chevrolet", model: "Camaro 6th Gen", year: 2018, tags: ["rwd", "manual", "v8", "coupe", "american", "over_400hp", "us_market", "2+2"] },
    { make: "Chevrolet", model: "Camaro 5th Gen", year: 2010, tags: ["rwd", "manual", "v8", "coupe", "american", "over_400hp", "us_market", "2+2"] },
    { make: "Chevrolet", model: "Camaro 3rd Gen", year: 1989, tags: ["rwd", "manual", "v8", "coupe", "american", "boxy", "us_market", "2+2"] },
    { make: "Dodge", model: "Charger B-Body", year: 1970, tags: ["rwd", "manual", "v8", "coupe", "american", "fast_furious", "us_market"] },
    
    { make: "Chevrolet", model: "Corvette C8", year: 2023, tags: ["rwd", "v8", "coupe", "american", "mid_engine", "two_seater", "over_400hp", "us_market"] },
    { make: "Chevrolet", model: "Corvette C5", year: 1997, tags: ["rwd", "v8","manual","two_seater", "coupe", "american", "us_market"]},
    { make: "Chevrolet", model: "Corvette C2 Stingray", year: 1963, tags: ["rwd", "manual", "v8", "coupe", "american", "two_seater", "us_market"] },
    { make: "Ford", model: "GT", year: 2005, tags: ["rwd", "manual", "turbo", "v8", "coupe", "american", "mid_engine", "two_seater", "six_figure", "limited_run", "over_400hp", "us_market"] }, // Supercharged — "turbo" question explicitly covers turbo OR supercharged
    { make: "Dodge", model: "Viper 2nd Gen", year: 1996, tags: ["rwd", "manual", "big_cyl", "coupe", "american", "two_seater", "over_400hp", "us_market"] },
    { make: "Buick", model: "Regal G-Body", year: 1987, tags: ["rwd", "turbo", "v6", "coupe", "american", "boxy", "us_market"] },
    { make: "Tesla", model: "Model 3 Highland", year: 2024, tags: ["awd", "ev", "sedan", "american", "us_market"] },
    { make: "Tesla", model: "Cybertruck", year: 2024, tags: ["awd", "ev", "truck", "american", "boxy", "over_400hp", "us_market"] },
    { make: "Ford", model: "F-150 P702", year: 2021, tags: ["awd", "turbo", "twin_turbo", "v6", "truck", "american", "boxy", "over_400hp", "us_market"] },
    { make: "Jeep", model: "Wrangler JL", year: 2024, tags: ["awd", "manual", "suv", "american", "convertible", "boxy", "us_market", "fold_flat_windshield"] },
    { make: "Ford", model: "Bronco 6th Gen", year: 2021, tags: ["awd", "manual", "suv", "american", "convertible", "boxy", "us_market"] },
    { make: "DeLorean", model: "DMC-12", year: 1981, tags: ["rwd", "manual", "v6", "coupe", "american", "back_to_the_future", "rear_engine", "two_seater", "wedge", "unusual_doors", "boxy", "limited_run", "us_market"] },
    { make: "Pontiac", model: "Firebird Third Generation", year: 1982, tags: ["rwd", "v8", "coupe", "american", "popups", "knight_rider", "wedge", "us_market"] },

    //  EUROPEAN
    { make: "Porsche", model: "911 Carrera 992", year: 2024, tags: ["rwd", "manual", "turbo", "twin_turbo", "coupe", "european", "boxer", "german", "rear_engine", "us_market", "2+2"] },
    { make: "Porsche", model: "911 GT3 997", year: 2007, tags: ["rwd", "manual", "coupe", "european", "boxer", "german", "rear_engine", "redline_8k", "big_wing", "six_figure", "over_400hp", "us_market", "2+2"] },
    { make: "Porsche", model: "944 Turbo", year: 1986, tags: ["rwd", "manual", "turbo", "coupe", "european", "popups", "german", "us_market", "2+2"] },
    { make: "Porsche", model: "Carrera GT 980", year: 2003, tags: ["mid-engine", "big_cyl", "over_400hp","redline_8k", "big_wing", "six_figure", "german", "manual", "european"] },
    { make: "Porsche", model: "944", year: 1986, tags: ["rwd", "manual", "coupe", "european", "popups", "german", "us_market", "2+2"] }, // Base added
    { make: "Porsche", model: "Cayman GT4 981", year: 2016, tags: ["rwd", "manual", "coupe", "european", "boxer", "mid_engine", "german", "two_seater", "big_wing", "us_market"] },
    { make: "Porsche", model: "Cayman 981", year: 2016, tags: ["rwd", "manual", "coupe", "european", "boxer", "mid_engine", "german", "two_seater", "us_market"] }, // Base added
    { make: "Volkswagen", model: "Golf GTI MK8", year: 2024, tags: ["fwd", "manual", "turbo", "hatchback", "european", "german", "us_market", "factory_lsd"] },
    { make: "Volkswagen", model: "Golf MK8", year: 2024, tags: ["fwd", "manual", "turbo", "hatchback", "european", "german", "us_market"] }, // Base added
    { make: "Volkswagen", model: "Golf R32 MK4", year: 2004, tags: ["awd", "manual", "v6", "hatchback", "european", "german", "us_market"] },
    { make: "Volkswagen", model: "Golf MK4", year: 2004, tags: ["fwd", "manual", "hatchback", "european", "german", "us_market"] }, // Base added
    { make: "Volkswagen", model: "Beetle Type 1", year: 1968, tags: ["rwd", "manual", "coupe", "european", "boxer", "german", "rear_engine", "lightweight", "us_market", "herbie"] },
    { make: "BMW", model: "M3 E30", year: 1988, tags: ["rwd", "manual", "coupe", "european", "german", "boxy", "us_market", "factory_lsd"] },
    { make: "BMW", model: "3 Series E30", year: 1988, tags: ["rwd", "manual", "coupe", "european", "german", "boxy", "us_market"] }, // Base added
    { make: "BMW", model: "M3 E46 Coupe", year: 2000, tags: ["rwd", "manual", "inline6", "coupe", "european", "german", "redline_8k", "us_market"] },
    { make: "BMW", model: "3 Series E46", year: 2000, tags: ["rwd", "manual", "inline6", "coupe", "european", "german", "us_market"] }, // Base added
    { make: "BMW", model: "M3 E90", year: 2010, tags: ["rwd", "manual", "v8", "coupe", "european", "german", "redline_8k", "over_400hp", "us_market"] },
    { make: "BMW", model: "E92", year: 2010, tags: ["rwd", "manual", "inline6", "coupe", "european", "german", "us_market"] }, // Base added
    { make: "Alfa Romeo", model: "Giulia Quadrifoglio", year: 2017, tags: ["rwd", "turbo", "twin_turbo", "v6", "sedan", "european", "italian", "over_400hp", "us_market"] },
    { make: "Mini", model: "Cooper S R53", year: 2005, tags: ["fwd", "manual", "turbo", "hatchback", "european", "british", "us_market"] }, // Supercharged — "turbo" question explicitly covers turbo OR supercharged
    { make: "Mini", model: "Cooper R50", year: 2005, tags: ["fwd", "manual", "hatchback", "european", "british", "us_market"] }, // Base naturally aspirated added
    { make: "Peugeot", model: "205 GTI", year: 1986, tags: ["fwd", "manual", "hatchback", "european", "lightweight", "flared_arches"] },
    { make: "Peugeot", model: "205", year: 1986, tags: ["fwd", "manual", "hatchback", "european", "lightweight"] }, // Base added
    { make: "Audi", model: "R8 Type 42", year: 2015, tags: ["awd", "manual", "v8", "coupe", "european", "german", "mid_engine", "two_seater", "six_figure", "over_400hp", "us_market"] },
    { make: "Audi", model: "Quattro Ur-Quattro", year: 1984, tags: ["awd", "manual", "turbo", "coupe", "european", "german", "boxy", "wrc"] },
    { make: "Mercedes-Benz", model: "SLS AMG", year: 2011, tags: ["rwd", "v8", "coupe", "european", "german", "unusual_doors", "two_seater", "six_figure", "over_400hp", "us_market"] },
    { make: "Mercedes-Benz", model: "G-Class Second Generation", year: 2019, tags: ["awd", "v8", "turbo", "twin_turbo", "suv", "european", "german", "boxy", "six_figure", "over_400hp", "us_market"] },
    { make: "Ferrari", model: "F40", year: 1990, tags: ["rwd", "manual", "turbo", "twin_turbo", "v8", "coupe", "european", "popups", "italian", "mid_engine", "two_seater", "wedge", "round_taillights", "big_wing", "six_figure", "limited_run", "lightweight", "over_400hp"] },
    { make: "Ferrari", model: "Testarossa", year: 1986, tags: ["rwd", "manual", "big_cyl", "boxer", "coupe", "european", "popups", "italian", "mid_engine", "two_seater", "wedge", "limited_run", "us_market"] },
    { make: "Ferrari", model: "250 GT California Spyder", year: 1957, tags: ["rwd", "manual", "big_cyl", "convertible", "european", "italian", "two_seater", "limited_run", "us_market"] },
    { make: "Lamborghini", model: "Aventador LP 740-4", year: 2020, tags: ["awd", "big_cyl", "coupe", "european", "italian", "mid_engine", "two_seater", "unusual_doors", "wedge", "redline_8k", "six_figure", "over_400hp", "us_market"] },
    { make: "Lamborghini", model: "Countach LP5000 QV", year: 1985, tags: ["rwd", "manual", "big_cyl", "coupe", "european", "popups", "italian", "mid_engine", "two_seater", "unusual_doors", "wedge", "six_figure", "limited_run", "over_400hp", "us_market", "dicaprio"] },
    { make: "Aston Martin", model: "DB5", year: 1964, tags: ["rwd", "manual", "coupe", "european", "british", "james_bond", "limited_run", "us_market", "2+2"] },
    { make: "McLaren", model: "F1", year: 1993, tags: ["rwd", "manual", "big_cyl", "coupe", "european", "british", "mid_engine", "unusual_doors", "wedge", "six_figure", "limited_run", "over_400hp"] },
{ make: "McLaren", model: "P1", year: 2014, tags: ["rwd", "automatic", "v8", "hybrid", "turbocharged", "coupe", "european", "british", "mid_engine", "unusual_doors", "six_figure", "limited_run", "over_400hp"] },    { make: "Lotus", model: "Elise S1", year: 1996, tags: ["rwd", "manual", "convertible", "european", "british", "mid_engine", "two_seater", "lightweight"] },
    { make: "Land Rover", model: "Defender 110", year: 1990, tags: ["awd", "manual", "suv", "european", "british", "boxy"] },
    { make: "Volvo", model: "240", year: 1990, tags: ["rwd", "manual", "sedan", "european", "boxy", "us_market"] },

    // OTHER ORIGINS (KOREA OR NICHE CARS LATER ON PERHAPS?)
    { make: "Hyundai", model: "Elantra N", year: 2024, tags: ["fwd", "manual", "turbo", "sedan", "us_market"] },
  ];

  // identify car eras for questions
  const eraTags = (year: number) => [
    ...(year < 1980 ? ["pre_1980"] : []),
    ...(year < 2000 ? ["pre_2000"] : []),
    ...(year < 2010 ? ["pre_2010"] : []),
    ...(year >= 2015 ? ["post_2015"] : []),
    ...(year >= 2020 ? ["post_2020"] : []),
  ];

  const validKeys = new Set(questionData.map(q => q.key));
  for (const car of carRoster) {
    for (const tag of [...car.tags, ...eraTags(car.year)]) {
      if (!validKeys.has(tag)) {
        throw new Error(`Unknown tag "${tag}" on ${car.make} ${car.model}`);
      }
    }
  }

  // add tags to db
  for (const carData of carRoster) {
    const [insertedCar] = await db.insert(cars).values({
      make: carData.make,
      model: carData.model,
      startYear: carData.year,
      endYear: carData.year,
      baseWeight: 1,
    }).returning();

    // Map through all questions
    const allTags = [...carData.tags, ...eraTags(carData.year)];
    const mappings = questionData.map((q) => ({
      carId: insertedCar.id,
      attributeId: qMap.get(q.key),
      isMatch: allTags.includes(q.key),
    }));

    await db.insert(carAttributes).values(mappings);
  }

  //update global stats
  await db.insert(globalStats).values({
    id: 1, totalGamesPlayed: 0, gameLengthDistribution: {},
  });
  console.log("initialized analytics global stats.");

  console.log(` Seeded ${questionData.length} questions and ${carRoster.length} cars`);

  process.exit(0);
}

main().catch((err) => {
  console.error("Erm... something is wrong... Seeding failed:", err);
  process.exit(1);
});