"use client";

import { useState, useEffect } from "react";
import { CreatableCombobox } from "@/components/ui/CreatableCombobox";
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Area,
  AreaChart,
  Pie,
  PieChart,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import CountUp from "react-countup";

interface Car {
  id: string;
  make: string;
  model: string;
  probability: number;
}

interface Question {
  id: string;
  questionText: string;
  category: string;
}
interface AnalyticsPayload {
  topCars: { make: string; model: string; guesses: number }[];
  totalGames: number;
  distributionChartData: { questions: number; frequency: number }[];
  topStumpedCars: { make: string; model: string; stumps: number }[];
  topQuestions: { text: string; asks: number }[];
}
export default function AutoGuesser() {
  const [answers, setAnswers] = useState<Record<string, boolean | null>>({});
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [topCars, setTopCars] = useState<Car[]>([]);
  const [universeOfCars, setUniverseOfCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [finalGuess, setFinalGuess] = useState<Car | null>(null);
  const [activeTab, setActiveTab] = useState<"play" | "analytics" | "about">(
    "play",
  );
  const [analyticsData, setAnalyticsData] = useState<AnalyticsPayload | null>(
    null,
  );
  //image support
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  // Feedback States
  const [feedbackMode, setFeedbackMode] = useState(false);
  const [selectedCarString, setSelectedCarString] = useState("");
  const [newQuestionText, setNewQuestionText] = useState("");
  const [newCategory, setNewCategory] = useState("drivetrain");
  const [answerHistory, setAnswerHistory] = useState<string[]>([]);

  useEffect(() => {
    // Only fetch if they are actually looking at the analytics tab
    if (activeTab === "analytics") {
      const fetchAnalytics = async () => {
        try {
          const res = await fetch("/api/analytics");
          if (res.ok) {
            const data = await res.json();
            setAnalyticsData(data);
          }
        } catch (error) {
          console.error("Failed to fetch analytics:", error);
        }
      };

      fetchAnalytics();
    }
  }, [activeTab]);
  const fetchNextTurn = async (
    currentAnswers: Record<string, boolean | null>,
  ) => {
    setLoading(true);
    try {
      const res = await fetch("/api/guess", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: currentAnswers }),
      });
      const data = await res.json();

      if (data.success) {
        setTopCars(data.topCars);
        setCurrentQuestion(data.nextQuestion);

        if (data.finalGuess) {
          setFinalGuess(data.finalGuess);
          try {
            const imgRes = await fetch(
              `/api/image?query=${encodeURIComponent(data.finalGuess.make + " " + data.finalGuess.model)}&carId=${data.finalGuess.id}`,
            );
            const imgData = await imgRes.json();
            if (imgData.imageUrl) setImageUrl(imgData.imageUrl);
          } catch (e) {
            console.error("Failed to load image");
          }
        }

        if (data.universeOfCars) setUniverseOfCars(data.universeOfCars);
      }
    } catch (error) {
      console.error("Failed to fetch next turn", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchNextTurn({});
  }, []);

  const handleAnswer = (isMatch: boolean | null) => {
    if (!currentQuestion) return;
    const newAnswers = { ...answers, [currentQuestion.id]: isMatch };
    setAnswers(newAnswers);
    //add to history array
    setAnswerHistory([...answerHistory, currentQuestion.id]);
    fetchNextTurn(newAnswers);
  };

  const handleRestart = () => {
    setAnswers({});
    setAnswerHistory([]);
    setFinalGuess(null);
    setCurrentQuestion(null);
    setTopCars([]);
    setFeedbackMode(false);
    setSelectedCarString("");
    setNewQuestionText("");
    fetchNextTurn({});
    setImageUrl(null);
  };
  const handleUndo = () => {
    if (answerHistory.length === 0) return;

    //copy current state
    const newHistory = [...answerHistory];
    const newAnswers = { ...answers };
    // pop last question
    const lastQuestionId = newHistory.pop();
    if (lastQuestionId) {
      delete newAnswers[lastQuestionId];
    }
    //update states and recalc (short for calculator)
    setAnswerHistory(newHistory);
    setAnswers(newAnswers);
    fetchNextTurn(newAnswers);
  };

  const submitFeedback = async () => {
    if (!selectedCarString || !newQuestionText) return;
    setLoading(true);
    try {
      await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userCarString: selectedCarString,
          newQuestionText,
          category: newCategory,
          engineGuessId: finalGuess?.id,
        }),
      });
      handleRestart();
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };
  const dynamicPieConfig =
    analyticsData?.topQuestions.reduce(
      (acc, q, index) => {
        acc[q.text] = {
          label: q.text,
          color: ["#a855f7", "#3b82f6", "#10b981", "#f59e0b", "#ef4444"][
            index % 5
          ],
        };
        return acc;
      },
      {} as Record<string, { label: string; color: string }>,
    ) || {};
  return (
    <main className="min-h-screen bg-gray-950 text-white p-4 md:p-8 font-sans">
      <div className="w-full max-w-6xl mx-auto">
        {/* HEADER AND TAGLINE */}
        <div className="text-center mb-10 mt-4 animate-in fade-in slide-in-from-top-4 duration-500">
          <h1 className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400 mb-4 tracking-tight">
            Auto Guesser
          </h1>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Think of a car, the model will attempt to read your mind. Guesses
            are powered by a Naive-Bayes algorithm.
          </p>
        </div>

        {/* NAVIGATION */}
        <div className="flex justify-center gap-4 mb-8">
          <button
            onClick={() => setActiveTab("play")}
            className={`px-6 py-2 rounded-full font-bold transition-all ${activeTab === "play" ? "bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.5)]" : "bg-gray-800 text-gray-400 hover:bg-gray-700"}`}
          >
            Play Game
          </button>
          <button
            onClick={() => setActiveTab("analytics")}
            className={`px-6 py-2 rounded-full font-bold transition-all ${activeTab === "analytics" ? "bg-emerald-600 text-white shadow-[0_0_15px_rgba(5,150,105,0.5)]" : "bg-gray-800 text-gray-400 hover:bg-gray-700"}`}
          >
            Global Analytics
          </button>
          <button
            onClick={() => setActiveTab("about")}
            className={`px-6 py-2 rounded-full font-bold transition-all ${activeTab === "about" ? "bg-purple-600 text-white shadow-[0_0_15px_rgba(147,51,234,0.5)]" : "bg-gray-800 text-gray-400 hover:bg-gray-700"}`}
          >
            How It Works
          </button>
        </div>

        {/* TAB ROUTING */}
        {activeTab === "play" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in zoom-in-95 duration-300">
            {/* Left Column: The Game Board */}
            <div className="bg-gray-900 p-8 rounded-xl shadow-lg border border-gray-800 flex flex-col justify-center min-h-[400px]">
              <div className="flex justify-between items-center mb-8">
                <button
                  onClick={handleRestart}
                  className="text-sm text-red-800 border-2 border-red-500 rounded px-4 py-2 hover:text-red-500 transition-colors"
                >
                  Restart
                </button>
              </div>
              <div className="min-h-[250px] flex items-center justify-center text-center mb-8">
                {loading ? (
                  <div className="animate-pulse space-y-4">
                    <div className="h-6 bg-gray-700 rounded w-3/4"></div>
                    <div className="h-12 bg-gray-700 rounded w-full"></div>
                  </div>
                ) : finalGuess ? (
                  feedbackMode ? (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 text-left bg-gray-800 p-6 rounded-xl border border-gray-700">
                      <h3 className="text-xl font-bold text-white mb-4">
                        Teach the Engine
                      </h3>

                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm text-gray-400 mb-2">
                            1. What car were you thinking of?
                          </label>
                          <CreatableCombobox
                            cars={universeOfCars}
                            onSelect={setSelectedCarString}
                          />
                        </div>

                        {selectedCarString && (
                          <div className="animate-in fade-in duration-300">
                            <label className="block text-sm text-gray-400 mb-2 mt-4">
                              2. Type a Yes/No question that is TRUE for the{" "}
                              {selectedCarString}, but FALSE for the{" "}
                              {finalGuess.make} {finalGuess.model}.
                            </label>
                            <input
                              type="text"
                              placeholder="e.g., Does it have a K-series?"
                              className="w-full bg-gray-900 border border-gray-700 text-white rounded-lg p-3 mb-4 focus:outline-none focus:border-blue-500"
                              value={newQuestionText}
                              onChange={(e) =>
                                setNewQuestionText(e.target.value)
                              }
                            />

                            <label className="block text-sm text-gray-400 mb-2">
                              3. What category is this question?
                            </label>
                            <select
                              className="w-full bg-gray-900 border border-gray-700 text-white rounded-lg p-3 mb-6 focus:outline-none focus:border-blue-500"
                              value={newCategory}
                              onChange={(e) => setNewCategory(e.target.value)}
                            >
                              <option value="drivetrain">Drivetrain</option>
                              <option value="engine">Engine</option>
                              <option value="body_style">Body Style</option>
                              <option value="origin">Origin</option>
                              <option value="design">Design</option>
                              <option value="pop_culture">Pop Culture</option>
                            </select>

                            <div className="flex gap-4">
                              <button
                                onClick={submitFeedback}
                                className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-lg font-bold transition-colors"
                              >
                                Submit
                              </button>
                              <button
                                onClick={handleRestart}
                                className="flex-1 bg-gray-600 hover:bg-gray-500 text-white py-3 rounded-lg font-bold transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center animate-in fade-in zoom-in duration-300">
                      <h2 className="text-3xl font-bold text-green-400 mb-2">
                        BINGO!
                      </h2>
                      <p className="text-gray-400 mb-6">
                        Are you thinking of the...
                      </p>
                      {/* image render section */}
                      {imageUrl && (
                        <div className="mb-6 flex justify-center animate-in fade-in zoom-in duration-700">
                          <img
                            src={imageUrl}
                            alt={`${finalGuess.make} ${finalGuess.model}`}
                            className="max-h-56 md:max-h-72 rounded-xl shadow-lg object-cover border border-gray-700"
                          />
                        </div>
                      )}
                      <div className="text-4xl font-extrabold text-white mb-8 bg-gray-800 py-6 rounded-lg border border-gray-700">
                        {finalGuess.make} {finalGuess.model}
                      </div>
                      <div className="flex gap-4">
                        <button
                          onClick={handleRestart}
                          className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-lg font-bold text-lg transition-colors shadow-lg"
                        >
                          Thats a Bingo!!!
                        </button>
                        <button
                          onClick={() => setFeedbackMode(true)}
                          className="flex-1 bg-red-600 hover:bg-red-500 text-white py-4 rounded-lg font-bold text-lg transition-colors shadow-lg"
                        >
                          No, incorrect...
                        </button>
                      </div>
                    </div>
                  )
                ) : currentQuestion ? (
                  <div className="animate-in slide-in-from-right-4 duration-300">
                    <h2
                      key={currentQuestion.id}
                      className="text-2xl md:text-3xl font-semibold text-white animate-in fade-in zoom-in-95 slide-in-from-bottom-4 duration-500 mb-8 min-h-[60px]"
                    >
                      {currentQuestion.questionText}
                    </h2>

                    {/* ANSWER BUTTONS */}
                    <div
                      className={`flex flex-row justify-center items-center gap-4 transition-opacity duration-150 ${
                        loading
                          ? "opacity-70 pointer-events-none"
                          : "opacity-100"
                      }`}
                    >
                      <button
                        onClick={() => handleAnswer(true)}
                        className="w-32 py-3 bg-emerald-600 hover:bg-emerald-500 rounded-xl font-bold text-white shadow-md"
                      >
                        Yes
                      </button>

                      <button
                        onClick={() => handleAnswer(false)}
                        className="w-32 py-3 bg-red-600 hover:bg-red-500 rounded-xl font-bold text-white shadow-md"
                      >
                        No
                      </button>

                      <button
                        onClick={() => handleAnswer(null)}
                        className="w-32 py-3 bg-gray-700 hover:bg-gray-600 rounded-xl font-bold text-white shadow-md"
                      >
                        Don't Know
                      </button>
                    </div>

                    {/* undo button */}
                    {answerHistory.length > 0 && (
                      <div className="mt-6 flex justify-center animate-in fade-in duration-300">
                        <button
                          onClick={handleUndo}
                          className="flex items-center gap-2 text-sm font-medium text-gray-400 hover:text-blue-400 transition-colors px-4 py-2 rounded-lg hover:bg-gray-800"
                        >
                          <svg //arrow thingy
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M3 7v6h6" />
                            <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
                          </svg>
                          Undo Last Answer
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  // game over
                  <div className="text-center">
                    <h2 className="text-2xl text-yellow-400 font-bold mb-6">
                      Game Over
                    </h2>
                    <p className="text-gray-400 mb-8">
                      I'm out of questions
                    </p>
                    <button
                      onClick={handleRestart}
                      className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-lg font-bold text-lg transition-colors"
                    >
                      Try Another Car
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Live Predictions */}
            <div className="bg-gray-900 p-8 rounded-xl shadow-lg border border-gray-800">
              <h2 className="text-xl font-bold mb-6 text-gray-400 uppercase tracking-wider flex items-center justify-between">
                Live Predictions
                <span className="text-xs bg-gray-800 px-3 py-1 rounded-full text-blue-400">
                  Engine Ver. $5 footlong
                </span>
              </h2>
              <div className="flex flex-col gap-3">
                {topCars.map((car, index) => (
                  <div
                    key={car.id}
                    className="p-4 bg-gray-900 border border-gray-700 rounded-xl flex justify-between items-center shadow-sm animate-in fade-in duration-500"
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-xl font-black text-gray-500 w-6">
                        #{index + 1}
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-lg">
                          {car.model}
                        </h4>
                        <p className="text-xs text-gray-400">{car.make}</p>
                      </div>
                    </div>

                    <div className="text-emerald-400 font-mono font-semibold text-lg tracking-wider">
                      <CountUp
                        end={car.probability * 100}
                        decimals={1}
                        duration={0.8}
                        preserveValue={true}
                        suffix="%"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "analytics" && analyticsData && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in zoom-in-95 duration-300">
            {/* CHART 1: Efficiency Bell Curve */}
            <div className="bg-gray-900 p-6 rounded-xl border border-gray-800">
              <h3 className="text-xl font-bold text-emerald-400 mb-2">
                Engine Efficiency
              </h3>
              <p className="text-sm text-gray-400 mb-6">
                Distribution of questions required to guess a car.
              </p>

              <ChartContainer
                config={{ frequency: { label: "Games", color: "#10b981" } }}
                className="h-[250px] w-full"
              >
                <AreaChart data={analyticsData.distributionChartData}>
                  <CartesianGrid vertical={false} stroke="#374151" />
                  <XAxis
                    dataKey="questions"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    stroke="#9ca3af"
                  />
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent />}
                  />
                  <Area
                    type="monotone"
                    dataKey="frequency"
                    stroke="#10b981"
                    fillOpacity={0.2}
                    fill="#10b981"
                  />
                </AreaChart>
              </ChartContainer>
            </div>

            {/* CHART 2: Most Guessed Cars */}
            <div className="bg-gray-900 p-6 rounded-xl border border-gray-800">
              <h3 className="text-xl font-bold text-blue-400 mb-2">
                Most Guessed Vehicles
              </h3>
              <p className="text-sm text-gray-400 mb-6">Top 5 popular cars.</p>

              <ChartContainer
                config={{ guesses: { label: "Guesses", color: "#3b82f6" } }}
                className="h-[250px] w-full"
              >
                <BarChart
                  data={analyticsData.topCars}
                  layout="vertical"
                  margin={{ left: 0 }}
                >
                  <CartesianGrid horizontal={false} stroke="#374151" />
                  <XAxis type="number" hide />
                  <YAxis
                    dataKey="model"
                    type="category"
                    axisLine={false}
                    tickLine={false}
                    stroke="#9ca3af"
                    width={120}
                  />
                  <ChartTooltip
                    cursor={{ fill: "#1f2937" }}
                    content={<ChartTooltipContent />}
                  />
                  <Bar dataKey="guesses" fill="#3b82f6" radius={4} />
                </BarChart>
              </ChartContainer>
            </div>

            <div className="bg-gray-900 p-6 rounded-xl border border-gray-800">
              <h3 className="text-xl font-bold text-red-400 mb-2">
                Engine Blind Spots
              </h3>
              <p className="text-sm text-gray-400 mb-6">
                Cars that stumped the algorithm the most.
              </p>

              <ChartContainer
                config={{ stumps: { label: "Stumps", color: "#f87171" } }}
                className="h-[250px] w-full"
              >
                <BarChart
                  data={analyticsData.topStumpedCars}
                  layout="vertical"
                  margin={{ left: 0 }}
                >
                  <CartesianGrid horizontal={false} stroke="#374151" />
                  <XAxis type="number" hide />
                  {/* model as Y-axis */}
                  <YAxis
                    dataKey="model"
                    type="category"
                    axisLine={false}
                    tickLine={false}
                    stroke="#9ca3af"
                    width={120}
                  />
                  <ChartTooltip
                    cursor={{ fill: "#1f2937" }}
                    content={<ChartTooltipContent />}
                  />
                  <Bar dataKey="stumps" fill="var(--color-stumps)" radius={4} />
                </BarChart>
              </ChartContainer>
            </div>

            <div className="bg-gray-900 p-6 rounded-xl border border-gray-800">
              <h3 className="text-xl font-bold text-purple-400 mb-2">
                Highest Utilization Questions
              </h3>
              <p className="text-sm text-gray-400 mb-6">
                The attributes most frequently used to split remaining guesses.
              </p>

              <ChartContainer
                config={dynamicPieConfig}
                className="h-[300px] w-full"
              >
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Pie
                    data={analyticsData.topQuestions.map((q, index) => ({
                      ...q,
                      fill: [
                        "#a855f7",
                        "#3b82f6",
                        "#10b981",
                        "#f59e0b",
                        "#ef4444",
                      ][index % 5],
                    }))}
                    dataKey="asks"
                    nameKey="text"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                  />
                  <ChartLegend
                    content={<ChartLegendContent nameKey="text" />}
                    className="mt-4 flex-wrap gap-2 text-xs text-gray-400"
                  />
                </PieChart>
              </ChartContainer>
            </div>
          </div>
        )}

        {activeTab === "about" && (
          <div className="bg-gray-900 p-8 md:p-12 rounded-xl border border-gray-800 space-y-8 animate-in fade-in zoom-in-95 duration-300">
            <div>
              <h2 className="text-2xl font-bold text-purple-400 mb-3">
                Lorem Ipsum
              </h2>
              <p className="text-gray-300 leading-relaxed">
                lorem ipsum dolor sit amet consectetur adipiscing elit enim et occaecat sed fugiat est cupidatat qui occaecat irure ullamco ut ad rerum et dolorum in facere assumenda pariatur deleniti dignissimos in optio nulla quidem ut nulla et ad molestias quidem sint est quis optio nam minus ut deserunt deleniti qui
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-purple-400 mb-3">
                Lorem ipsum
              </h2>
              <p className="text-gray-300 leading-relaxed">
                lorem ipsum dolor sit amet consectetur adipiscing elit enim et occaecat sed fugiat est cupidatat qui occaecat irure ullamco ut ad rerum et dolorum in facere assumenda pariatur deleniti dignissimos in optio nulla quidem ut nulla et ad molestias quidem sint est quis optio nam minus ut deserunt deleniti qui
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-purple-400 mb-3">
                Lorem Ipsum
              </h2>
              <p className="text-gray-300 leading-relaxed">
                lorem ipsum dolor sit amet consectetur adipiscing elit enim et occaecat sed fugiat est cupidatat qui occaecat irure ullamco ut ad rerum et dolorum in facere assumenda pariatur deleniti dignissimos in optio nulla quidem ut nulla et ad molestias quidem sint est quis optio nam minus ut deserunt deleniti qui
              </p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
