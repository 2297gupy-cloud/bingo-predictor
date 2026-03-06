import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("bingo.dbStats", () => {
  it("returns stats object with expected shape", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.bingo.dbStats();

    expect(result).toHaveProperty("total_draws");
    expect(result).toHaveProperty("latest_term");
    expect(result).toHaveProperty("latest_date");
    expect(result).toHaveProperty("latest_time");
    expect(typeof result.total_draws).toBe("number");
  });
});

describe("bingo.latest", () => {
  it("returns null or a valid draw object", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.bingo.latest();

    if (result !== null) {
      expect(result).toHaveProperty("term");
      expect(result).toHaveProperty("draw_date");
      expect(result).toHaveProperty("draw_time");
      expect(result).toHaveProperty("numbers");
      expect(result).toHaveProperty("draw_order");
      expect(result).toHaveProperty("special");
      expect(result).toHaveProperty("big_small");
      expect(result).toHaveProperty("odd_even");
      expect(Array.isArray(result.numbers)).toBe(true);
      expect(Array.isArray(result.draw_order)).toBe(true);
    }
  });
});

describe("bingo.frequency", () => {
  it("returns an array of frequency items", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.bingo.frequency({ window: 10 });

    expect(Array.isArray(result)).toBe(true);
    if (result.length > 0) {
      expect(result[0]).toHaveProperty("number");
      expect(result[0]).toHaveProperty("count");
      expect(typeof result[0].number).toBe("number");
      expect(typeof result[0].count).toBe("number");
    }
  });
});

describe("bingo.consecutive", () => {
  it("returns an array of consecutive items", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.bingo.consecutive({ window: 5 });

    expect(Array.isArray(result)).toBe(true);
    if (result.length > 0) {
      expect(result[0]).toHaveProperty("number");
      expect(result[0]).toHaveProperty("streak");
    }
  });
});

describe("bingo.predict", () => {
  it("returns prediction with correct number of picks", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.bingo.predict({
      strategy: "balanced",
      pick: 5,
      window: 20,
    });

    expect(result).toHaveProperty("numbers");
    expect(result).toHaveProperty("strategy");
    expect(result).toHaveProperty("description");
    expect(result.strategy).toBe("balanced");
    expect(Array.isArray(result.numbers)).toBe(true);
    expect(result.numbers.length).toBe(5);
    // Numbers should be sorted
    for (let i = 1; i < result.numbers.length; i++) {
      expect(result.numbers[i]).toBeGreaterThanOrEqual(result.numbers[i - 1]);
    }
  });

  it("supports all strategy types", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const strategies = ["hot", "cold", "balanced", "weighted", "overdue"] as const;

    for (const strategy of strategies) {
      const result = await caller.bingo.predict({
        strategy,
        pick: 3,
        window: 10,
      });
      expect(result.strategy).toBe(strategy);
      expect(result.numbers.length).toBe(3);
    }
  });
});

describe("bingo.sync", () => {
  it("sync mutation returns synced count", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.bingo.sync({ days: 1 });

    expect(result).toHaveProperty("synced");
    expect(typeof result.synced).toBe("number");
    expect(result.synced).toBeGreaterThanOrEqual(0);
  }, 30_000);
});

describe("processRawData", () => {
  it("correctly calculates draw time from index", async () => {
    const { processRawData } = await import("./bingo");
    const mockData = [
      {
        drawTerm: 115013001,
        bigShowOrder: ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10",
                       "11", "12", "13", "14", "15", "16", "17", "18", "19", "20"],
        openShowOrder: ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10",
                        "11", "12", "13", "14", "15", "16", "17", "18", "19", "20"],
        bullEyeTop: "05",
        highLowTop: "\u5927",
        oddEvenTop: "\u55ae",
      },
      {
        drawTerm: 115013002,
        bigShowOrder: ["21", "22", "23", "24", "25", "26", "27", "28", "29", "30",
                       "31", "32", "33", "34", "35", "36", "37", "38", "39", "40"],
        openShowOrder: ["21", "22", "23", "24", "25", "26", "27", "28", "29", "30",
                        "31", "32", "33", "34", "35", "36", "37", "38", "39", "40"],
        bullEyeTop: "25",
        highLowTop: "\u5c0f",
        oddEvenTop: "\u96d9",
      },
    ];

    const result = processRawData(mockData, "2026-03-06");
    expect(result.length).toBe(2);
    // First draw (index 0): 07:05
    expect(result[0].drawTime).toBe("07:05");
    // Second draw (index 1): 07:10
    expect(result[1].drawTime).toBe("07:10");
    // Check numbers are sorted
    expect(result[0].numbers).toBe("1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20");
    expect(result[0].special).toBe(5);
    expect(result[0].bigSmall).toBe("\u5927");
    expect(result[0].oddEven).toBe("\u55ae");
  });
});

describe("bingo.history", () => {
  it("returns paginated history with correct shape", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.bingo.history({
      page: 1,
      pageSize: 5,
    });

    expect(result).toHaveProperty("draws");
    expect(result).toHaveProperty("total");
    expect(result).toHaveProperty("page");
    expect(result).toHaveProperty("pageSize");
    expect(Array.isArray(result.draws)).toBe(true);
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(5);

    if (result.draws.length > 0) {
      const draw = result.draws[0];
      expect(draw).toHaveProperty("term");
      expect(draw).toHaveProperty("numbers");
      expect(Array.isArray(draw.numbers)).toBe(true);
    }
  });
});
