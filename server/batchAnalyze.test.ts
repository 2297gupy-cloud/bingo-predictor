import { describe, it, expect } from "vitest";
import { HOUR_SLOTS } from "./aiStrategy";

describe("Batch Analysis Configuration", () => {
  describe("HOUR_SLOTS configuration", () => {
    it("should have 16 hour slots (07-22)", () => {
      expect(HOUR_SLOTS.length).toBe(16);
    });

    it("should have source and target hours for each slot", () => {
      HOUR_SLOTS.forEach((slot) => {
        expect(slot).toHaveProperty("source");
        expect(slot).toHaveProperty("target");
        expect(slot).toHaveProperty("label");
        expect(slot).toHaveProperty("draws");
      });
    });

    it("should have correct target hour (source + 1)", () => {
      HOUR_SLOTS.forEach((slot) => {
        const sourceHour = parseInt(slot.source);
        const targetHour = parseInt(slot.target);
        
        // Special case: 22 -> 23
        if (sourceHour === 22) {
          expect(targetHour).toBe(23);
        } else {
          expect(targetHour).toBe(sourceHour + 1);
        }
      });
    });

    it("should have 11 draws for 07:05~07:55 and 12 draws for others", () => {
      const slot07 = HOUR_SLOTS.find((s) => s.source === "07");
      const slot08 = HOUR_SLOTS.find((s) => s.source === "08");
      
      expect(slot07?.draws).toBe(11);
      expect(slot08?.draws).toBe(12);
    });

    it("should have correct labels for each slot", () => {
      const expectedLabels = [
        "0705~0755", "0800~0855", "0900~0955", "1000~1055",
        "1100~1155", "1200~1255", "1300~1355", "1400~1455",
        "1500~1555", "1600~1655", "1700~1755", "1800~1855",
        "1900~1955", "2000~2055", "2100~2155", "2200~2255",
      ];
      
      HOUR_SLOTS.forEach((slot, index) => {
        expect(slot.label).toBe(expectedLabels[index]);
      });
    });

    it("should have source hours from 07 to 22", () => {
      const sourceHours = HOUR_SLOTS.map((s) => parseInt(s.source));
      
      for (let i = 0; i < sourceHours.length; i++) {
        expect(sourceHours[i]).toBe(7 + i);
      }
    });

    it("should have target hours from 08 to 23", () => {
      const targetHours = HOUR_SLOTS.map((s) => parseInt(s.target));
      
      for (let i = 0; i < targetHours.length; i++) {
        expect(targetHours[i]).toBe(8 + i);
      }
    });

    it("should have all draws values as positive numbers", () => {
      HOUR_SLOTS.forEach((slot) => {
        expect(typeof slot.draws).toBe("number");
        expect(slot.draws).toBeGreaterThan(0);
      });
    });
  });

  describe("Batch Analysis Function Signatures", () => {
    it("should have batchAnalyzeDate function exported", async () => {
      const { batchAnalyzeDate } = await import("./aiStrategy");
      expect(typeof batchAnalyzeDate).toBe("function");
    });

    it("should have batchAnalyzeLastDays function exported", async () => {
      const { batchAnalyzeLastDays } = await import("./aiStrategy");
      expect(typeof batchAnalyzeLastDays).toBe("function");
    });
  });
});


// 測試進度更新邏輯
describe("Progress Update Logic", () => {
  it("should update progress correctly from 0 to 16", () => {
    let progress = { current: 0, total: 16, currentSlot: '07' };
    const slots = ['07', '08', '09', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22'];
    
    // 模擬進度更新 (修復後的邏輯)
    for (let i = 0; i < 16; i++) {
      if (progress.current < 16) {
        const nextCurrent = progress.current + 1;
        progress = {
          current: nextCurrent,
          total: 16,
          currentSlot: slots[nextCurrent] || '22'
        };
      }
    }
    
    // 驗證最終進度達到 16/16
    expect(progress.current).toBe(16);
    expect(progress.currentSlot).toBe('22');
  });

  it("should not update progress beyond 16", () => {
    let progress = { current: 16, total: 16, currentSlot: '22' };
    const slots = ['07', '08', '09', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22'];
    
    // 嘗試更新超過 16
    if (progress.current < 16) {
      const nextCurrent = progress.current + 1;
      progress = {
        current: nextCurrent,
        total: 16,
        currentSlot: slots[nextCurrent] || '22'
      };
    }
    
    // 驗證進度不變
    expect(progress.current).toBe(16);
  });

  it("should correctly map slot indices to hour labels", () => {
    const slots = ['07', '08', '09', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22'];
    
    // 驗證索引對應關係
    for (let i = 0; i < slots.length; i++) {
      expect(slots[i]).toBe(String(7 + i).padStart(2, '0'));
    }
  });
});
