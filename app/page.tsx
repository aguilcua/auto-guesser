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

  //more feedback :P
  const [crowdSourceQuestion, setCrowdSourceQuestion] = useState<any>(null);
  const [voteSubmitted, setVoteSubmitted] = useState(false);
  const [isVictoryConfirmed, setIsVictoryConfirmed] = useState(false);

  //debug
  const [showDebug, setShowDebug] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

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
          setCrowdSourceQuestion(data.crowdSourceQuestion || null);
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
  const currentQuestionNumber = Object.keys(answers).length + 1;
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
    setVoteSubmitted(false);
    setIsVictoryConfirmed(false);
    setVoteSubmitted(false);
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

  const submitCrowdSourceVote = async (isMatch: boolean | null) => {
    if (!finalGuess || !crowdSourceQuestion || isMatch === null) {
      setVoteSubmitted(true);
      return;
    }
    try {
      await fetch("/api/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          carId: finalGuess.id,
          attributeId: crowdSourceQuestion.id,
          isMatch: isMatch,
        }),
      });
    } catch (e) {
      console.error("Failed to submit vote", e);
    } finally {
      setVoteSubmitted(true);
    }
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

  const handleDebugToggle = () => {
    if (isTransitioning) return;

    setIsTransitioning(true);

    setTimeout(() => {
      setShowDebug((prev) => !prev);

      setTimeout(() => {
        setIsTransitioning(false);
      }, 50);
    }, 300);
  };
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
          <div
            className={`mx-auto w-full transition-all duration-300 ease-in-out ${
              isTransitioning
                ? "opacity-0 scale-95 blur-sm"
                : "opacity-100 scale-100 blur-0"
            } ${
              showDebug
                ? "max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-8"
                : "max-w-2xl flex flex-col"
            }`}
          >
            {/* Left Column: The Game Board */}
            <div className="bg-gray-900 p-8 rounded-xl shadow-lg border border-gray-800 flex flex-col justify-center min-h-[400px]">
              <div className="flex justify-between items-center mb-8">
                <button
                  onClick={handleRestart}
                  className="text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-2 px-3 py-1.5 border border-gray-800 rounded-lg hover:bg-gray-800"
                >
                  ↺ Restart
                </button>

                <div className="flex items-center gap-3">
                  {/* DEBUG TOGGLE ICON */}
                  <button
                    onClick={handleDebugToggle}
                    className={`p-1.5 rounded-lg border transition-colors ${
                      showDebug
                        ? "bg-blue-600/20 border-blue-500/50 text-blue-400"
                        : "bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700 hover:text-white"
                    }`}
                    title="Toggle Engine Predictions"
                  >
                    <svg
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
                      <path d="m8 2 1.88 1.88" />
                      <path d="M14.12 3.88 16 2" />
                      <path d="M9 7.13v-1a3.003 3.003 0 1 1 6 0v1" />
                      <path d="M12 20c-3.3 0-6-2.7-6-6v-3a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v3c0 3.3-2.7 6-6 6" />
                      <path d="M12 20v-9" />
                      <path d="M6.53 9C4.6 8.8 3 7.1 3 5" />
                      <path d="M17.47 9c1.93-.2 3.53-1.9 3.53-4" />
                      <path d="M8 14H4" />
                      <path d="M20 14h-4" />
                      <path d="M9 18h-5" />
                      <path d="M20 18h-5" />
                    </svg>
                  </button>

                  {/* QUESTION COUNTER */}
                  <div className="text-xs font-mono font-bold text-emerald-400 bg-emerald-400/10 px-3 py-1.5 rounded-full border border-emerald-400/20 shadow-sm">
                    # {currentQuestionNumber}
                  </div>
                </div>
              </div>
              <div className="min-h-[250px] flex items-center justify-center text-center mb-8">
                {loading && !currentQuestion && !finalGuess ? (
                  <div className="animate-pulse space-y-4">
                    <div className="h-6 bg-gray-700 rounded w-3/4"></div>
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

                      {isVictoryConfirmed ? (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                          {crowdSourceQuestion && !voteSubmitted ? (
                            <div className="mb-6 p-4 bg-gray-800 rounded-xl border border-gray-600">
                              <p className="text-sm font-semibold text-emerald-400 mb-2">
                                HELP US GET SMARTER
                              </p>
                              <p className="text-white mb-4">
                                Does the{" "}
                                <span className="font-bold">
                                  {finalGuess.model}
                                </span>{" "}
                                match this description?
                                <br />
                                <span className="italic text-gray-300 mt-2 block">
                                  "{crowdSourceQuestion.questionText}"
                                </span>
                              </p>

                              <div className="grid grid-cols-3 gap-2">
                                <button
                                  onClick={() => submitCrowdSourceVote(true)}
                                  className="py-3 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-white font-bold transition-colors"
                                >
                                  Yes
                                </button>
                                <button
                                  onClick={() => submitCrowdSourceVote(false)}
                                  className="py-3 bg-red-600 hover:bg-red-500 rounded-lg text-white font-bold transition-colors"
                                >
                                  No
                                </button>
                                <button
                                  onClick={() => submitCrowdSourceVote(null)}
                                  className="py-3 bg-gray-600 hover:bg-gray-500 rounded-lg text-white font-bold transition-colors"
                                >
                                  Skip
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="mb-6 text-emerald-400 font-bold italic">
                              {voteSubmitted ? "Thanks for contributing!" : ""}
                            </div>
                          )}

                          <button
                            onClick={() => {
                              handleRestart();
                              setIsVictoryConfirmed(false);
                              setVoteSubmitted(false);
                            }}
                            className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-lg font-bold text-lg transition-colors shadow-lg"
                          >
                            Play Again
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-4">
                          <button
                            onClick={() => {
                              console.log(
                                "🔥 BINGO CLICKED! Current Question State is:",
                                crowdSourceQuestion,
                              );
                              setIsVictoryConfirmed(true);
                            }}
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
                      )}
                    </div>
                  )
                ) : currentQuestion ? (
                  <div className="w-full">
                    {/* Fixed Height Text Container */}
                    <div className="min-h-[120px] flex items-center justify-center mb-8">
                      <h2
                        key={currentQuestion.id}
                        className="text-2xl md:text-3xl font-semibold text-white animate-in fade-in slide-in-from-right-8 duration-300"
                      >
                        {currentQuestion.questionText}
                      </h2>
                    </div>

                    {/* ANSWER BUTTONS */}
                    <div
                      className={`w-full max-w-sm sm:max-w-md mx-auto grid grid-cols-2 sm:grid-cols-3 gap-3`}
                    >
                      <button
                        onClick={() => handleAnswer(true)}
                        className="col-span-1 py-3 bg-emerald-600 hover:bg-emerald-500 rounded-xl font-bold text-white shadow-md transition-transform active:scale-95"
                      >
                        Yes
                      </button>

                      <button
                        onClick={() => handleAnswer(false)}
                        className="col-span-1 py-3 bg-red-600 hover:bg-red-500 rounded-xl font-bold text-white shadow-md transition-transform active:scale-95"
                      >
                        No
                      </button>

                      <button
                        onClick={() => handleAnswer(null)}
                        className="col-span-2 sm:col-span-1 py-3 bg-gray-700 hover:bg-gray-600 rounded-xl font-bold text-white shadow-md transition-transform active:scale-95"
                      >
                        Don't Know
                      </button>
                    </div>

                    {/* Undo Button */}
                    {answerHistory.length > 0 && (
                      <div className="mt-6 flex justify-center">
                        <button
                          onClick={handleUndo}
                          disabled={loading}
                          className={`flex items-center gap-2 text-sm font-medium text-gray-400 hover:text-blue-400 px-4 py-2 rounded-lg hover:bg-gray-800 transition-transform active:scale-95`}
                        >
                          <svg
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
                    <p className="text-gray-400 mb-8">I'm out of questions</p>
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
            {showDebug && (
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
            )}
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
                className="h-[340px] w-full"
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
                The Mind-Reading Engine
              </h2>
              <p className="text-gray-300 leading-relaxed">
                Auto Guesser is basically the game 20 questions specifically for
                cars. The model is centered around a simple probabilistic
                machine learning concept called Naive Bayes. When you start a
                run/game, every vehicle in the database has a baseline
                probability. Every time you answer a question, the engine
                recalculates the entire board. With each question answered, the
                model aims at reducing entropy (reducing uncertainty), by
                splitting the remaining cars into two separate groups based on
                your answer. Eventually, the difference in probability between
                the top two contenders becomes so wide, evoking a final guess
                (and hopefully a correct answer).
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-emerald-400 mb-3">
                Powered by Players
              </h2>
              <p className="text-gray-300 leading-relaxed">
                Initially the model is pre populated with a seeding file of ~60
                attributes(questions) and ~80 cars, Unfortunately, this list is
                non-exhaustive. That is where your help comes in! The engine was
                created in hopes of actively learning from the user. When the
                model guesses the wrong car, the user is given the opportunity
                to correct the model by inserting an additional attribute that
                differentiates the user's car with a preexisting/new car in the
                database. Optionally the game ends with a correct final guess,
                the engine will often ask to verify a random fact about the
                final guess car. i.e. "Was it primarily featured in the Fast and
                Furious franchise?". For now, once at least 3 players agree on
                an answer that attribute becomes a permanent rule in the
                database. Everytime someone plays and contributes the model
                becomes more accurate and fills in blindspots.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-blue-400 mb-3">
                The Math Behind the Magic
              </h2>
              <p className="text-gray-300 leading-relaxed">
                Behind the scenes the algorithm uses a relative scoring system.
                Meaning, if a car's known attributes match your answers, its
                score/probability doubles. If its attributes contradict your
                answer, the score is drastically reduced. What happens if a new
                car lacks mapping for some of its attributes? At that point in
                this instance the car gets a neutral scoring. This way a new car
                with missing info isn't punished and stays in the middle, until
                further answers prove it wrong.
              </p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
