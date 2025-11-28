// app/page.tsx
"use client";

import { useState } from "react";

type FormState = {
  fishName: string;
  baseDenominator: string; // X dari "1 : X"
  totalLuck: string; // persen
  totalCaught: string; // jumlah cast
};

type Result = {
  valid: boolean;
  singleChancePct: number; // peluang per cast (%)
  cumulativeChancePct: number; // peluang minimal 1x (%)
  respawnAfter: number | null; // saran respawn setelah berapa cast
  steps: string[]; // "Langkah selanjutnya..."
  warnings: string[];
};

export default function HomePage() {
  const [form, setForm] = useState<FormState>({
    fishName: "",
    baseDenominator: "",
    totalLuck: "",
    totalCaught: ""
  });

  const [result, setResult] = useState<Result | null>(null);

  const handleChange =
    (field: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm(prev => ({ ...prev, [field]: e.target.value }));
    };

  const formatPercent = (value: number) => {
    if (Number.isNaN(value)) return "-";
    if (value <= 0) return "0%";
    if (value >= 100) return "100%";
    if (value < 0.01) return "< 0,01%";
    return `${value.toFixed(2)}%`;
  };

  const computeResult = (data: FormState): Result => {
    const baseDenom = parseFloat(data.baseDenominator.replace(",", "."));
    const luckPct = parseFloat(data.totalLuck.replace(",", "."));
    const totalCaught = parseFloat(data.totalCaught.replace(",", "."));

    const warnings: string[] = [];
    const steps: string[] = [];

    if (!data.fishName.trim()) {
      warnings.push("Nama ikan masih kosong (opsional, tapi lebih enak kalau diisi).");
    }

    if (!baseDenom || baseDenom <= 0) {
      warnings.push("Peluang dasar (1 : X) harus diisi dengan X > 0.");
      return {
        valid: false,
        singleChancePct: 0,
        cumulativeChancePct: 0,
        respawnAfter: null,
        steps,
        warnings
      };
    }

    const baseP = 1 / baseDenom;

    const luckMultiplier = 1 + (isNaN(luckPct) ? 0 : luckPct / 100);
    const pRaw = baseP * luckMultiplier;
    const pEff = Math.min(Math.max(pRaw, 0), 1); // clamp 0–1

    if (pEff <= 0) {
      warnings.push("Total Luck terlalu rendah / nilai tidak valid, peluang efektif = 0.");
    }

    // peluang per cast (%)
    const singleChancePct = pEff * 100;

    // peluang kumulatif minimal 1x setelah N cast
    const n = isNaN(totalCaught) || totalCaught <= 0 ? 0 : Math.floor(totalCaught);
    const cumulativeChancePct =
      n > 0 && pEff > 0 ? (1 - Math.pow(1 - pEff, n)) * 100 : 0;

    // saran "respawn setelah..." (berdasar ekspektasi 1/p)
    let respawnAfter: number | null = null;
    if (pEff > 0 && pEff < 1) {
      respawnAfter = Math.round(1 / pEff);
    }

    // Langkah selanjutnya (logika kasar berdasarkan peluang & Luck)
    if (pEff <= 0) {
      steps.push("Periksa kembali input X dan Luck kamu. Tanpa peluang efektif, tidak mungkin mendapatkan ikan ini.");
    } else {
      if (singleChancePct < 0.05) {
        steps.push(
          "Peluang per cast sangat kecil. Fokus tingkatkan Total Luck (rod, enchant, totem) sebelum grind panjang."
        );
      } else if (singleChancePct < 0.5) {
        steps.push(
          "Peluang per cast masih rendah, tapi bisa digas kalau kamu siap grind panjang. Tingkatkan Luck jika memungkinkan."
        );
      } else {
        steps.push(
          "Peluang per cast sudah lumayan. Saatnya grind konsisten dan manfaatkan semua bonus (event, boost, dsb)."
        );
      }

      if (n === 0) {
        steps.push(
          "Masukkan Total Caught (jumlah cast) untuk melihat peluang kumulatif dan rekomendasi respawn."
        );
      } else {
        if (cumulativeChancePct < 20) {
          steps.push(
            "Peluang kumulatif kamu masih di bawah 20%. Wajar kalau belum dapat ikan ini, terus main santai saja."
          );
        } else if (cumulativeChancePct < 60) {
          steps.push(
            "Peluang kumulatif berada di level menengah. Kamu sudah cukup jauh mencoba, tapi masih wajar kalau belum drop."
          );
        } else if (cumulativeChancePct < 90) {
          steps.push(
            "Kamu sudah punya peluang kumulatif yang cukup tinggi. Tetap sabar, RNG bisa iseng."
          );
        } else {
          steps.push(
            "Secara statistik kamu 'harusnya' sudah sering dapat, tapi RNG tetap acak. Kalau belum dapat, berarti kamu lagi kena bad luck streak."
          );
        }

        if (respawnAfter && n > respawnAfter * 2) {
          steps.push(
            "Kamu sudah jauh melewati perkiraan rata-rata 1 drop. Pertimbangkan untuk 'respawn': ganti server, pindah spot, atau istirahat sebentar."
          );
        } else if (respawnAfter) {
          steps.push(
            `Kalau mengikuti metode komunitas, kamu bisa coba 'respawn' setelah sekitar ${respawnAfter} cast tanpa drop sebagai ritual reset mental (secara matematika RNG tetap acak).`
          );
        }
      }
    }

    return {
      valid: true,
      singleChancePct,
      cumulativeChancePct,
      respawnAfter,
      steps,
      warnings
    };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const res = computeResult(form);
    setResult(res);
  };

  const fishLabel = form.fishName.trim() || "ikan target";

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-10">
      <div
        style={{
          width: "100%",
          maxWidth: 960,
          borderRadius: 24,
          padding: 24,
          background:
            "linear-gradient(135deg, rgba(15,23,42,0.95), rgba(15,23,42,0.9))",
          boxShadow: "0 25px 60px rgba(0,0,0,0.5)",
          border: "1px solid rgba(148,163,184,0.25)"
        }}
      >
        <header style={{ marginBottom: 24 }}>
          <h1
            style={{
              fontSize: "1.9rem",
              fontWeight: 700,
              letterSpacing: "-0.03em",
              marginBottom: 4
            }}
          >
            RNG Calculator – Fish It (Roblox)
          </h1>
          <p style={{ color: "#9ca3af", fontSize: "0.95rem" }}>
            Hitung peluang mendapatkan ikan langka berdasarkan{" "}
            <strong>Total Luck</strong>, <strong>Total Caught</strong>, dan{" "}
            <strong>base rate 1:X</strong>.
          </p>
        </header>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1.2fr) minmax(0, 1fr)",
            gap: 20,
            alignItems: "flex-start"
          }}
        >
          {/* Form Input */}
          <form onSubmit={handleSubmit}>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 14
              }}
            >
              <div>
                <label
                  htmlFor="fishName"
                  style={{ fontSize: 13, fontWeight: 600, color: "#d1d5db" }}
                >
                  Nama Ikan (optional)
                </label>
                <input
                  id="fishName"
                  placeholder="Contoh: Orca, Crystal Crab, dsb."
                  value={form.fishName}
                  onChange={handleChange("fishName")}
                  style={{
                    marginTop: 6,
                    width: "100%",
                    padding: "8px 10px",
                    borderRadius: 10,
                    border: "1px solid rgba(148,163,184,0.4)",
                    backgroundColor: "#020617",
                    color: "#e5e7eb",
                    fontSize: 13
                  }}
                />
              </div>

              <div>
                <label
                  htmlFor="baseDenominator"
                  style={{ fontSize: 13, fontWeight: 600, color: "#d1d5db" }}
                >
                  Peluang dasar ikan (1 : X)
                </label>
                <div
                  style={{
                    marginTop: 6,
                    display: "flex",
                    alignItems: "center",
                    gap: 8
                  }}
                >
                  <span
                    style={{
                      fontSize: 13,
                      color: "#9ca3af",
                      padding: "7px 10px",
                      borderRadius: 10,
                      border: "1px solid rgba(148,163,184,0.4)",
                      backgroundColor: "#020617"
                    }}
                  >
                    1 :
                  </span>
                  <input
                    id="baseDenominator"
                    type="number"
                    min="1"
                    placeholder="Misal 1500000 untuk 1 : 1.500.000"
                    value={form.baseDenominator}
                    onChange={handleChange("baseDenominator")}
                    style={{
                      flex: 1,
                      padding: "8px 10px",
                      borderRadius: 10,
                      border: "1px solid rgba(148,163,184,0.4)",
                      backgroundColor: "#020617",
                      color: "#e5e7eb",
                      fontSize: 13
                    }}
                  />
                </div>
                <p style={{ marginTop: 4, color: "#6b7280", fontSize: 11 }}>
                  Ini adalah base rate sebelum Luck. Angka besar = ikan sangat
                  langka.
                </p>
              </div>

              <div>
                <label
                  htmlFor="totalLuck"
                  style={{ fontSize: 13, fontWeight: 600, color: "#d1d5db" }}
                >
                  Total Luck (%) kamu
                </label>
                <input
                  id="totalLuck"
                  type="number"
                  placeholder="Misal: 0, 50, 120 ..."
                  value={form.totalLuck}
                  onChange={handleChange("totalLuck")}
                  style={{
                    marginTop: 6,
                    width: "100%",
                    padding: "8px 10px",
                    borderRadius: 10,
                    border: "1px solid rgba(148,163,184,0.4)",
                    backgroundColor: "#020617",
                    color: "#e5e7eb",
                    fontSize: 13
                  }}
                />
                <p style={{ marginTop: 4, color: "#6b7280", fontSize: 11 }}>
                  Diinterpretasikan sebagai multiplier: 100% Luck = peluang 2x
                  dari base, 50% = 1,5x, dst.
                </p>
              </div>

              <div>
                <label
                  htmlFor="totalCaught"
                  style={{ fontSize: 13, fontWeight: 600, color: "#d1d5db" }}
                >
                  Total Caught / Total Cast (N)
                </label>
                <input
                  id="totalCaught"
                  type="number"
                  min="0"
                  placeholder="Berapa kali kamu sudah mancing / cast?"
                  value={form.totalCaught}
                  onChange={handleChange("totalCaught")}
                  style={{
                    marginTop: 6,
                    width: "100%",
                    padding: "8px 10px",
                    borderRadius: 10,
                    border: "1px solid rgba(148,163,184,0.4)",
                    backgroundColor: "#020617",
                    color: "#e5e7eb",
                    fontSize: 13
                  }}
                />
                <p style={{ marginTop: 4, color: "#6b7280", fontSize: 11 }}>
                  Digunakan untuk menghitung peluang kumulatif minimal sekali
                  dapat {fishLabel}.
                </p>
              </div>

              <button
                type="submit"
                style={{
                  marginTop: 6,
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: 999,
                  border: "none",
                  fontWeight: 600,
                  fontSize: 14,
                  background:
                    "linear-gradient(135deg, #22c55e, #16a34a, #15803d)",
                  color: "white",
                  cursor: "pointer",
                  boxShadow: "0 10px 30px rgba(16,185,129,0.45)"
                }}
              >
                Hitung Peluang RNG
              </button>

              <p style={{ marginTop: 4, color: "#6b7280", fontSize: 11 }}>
                Rumus di sini adalah model komunitas (fan-made). Developer
                Fish It tidak mempublikasikan rumus resmi RNG.
              </p>
            </div>
          </form>

          {/* Hasil */}
          <div
            style={{
              padding: 14,
              borderRadius: 18,
              backgroundColor: "rgba(15,23,42,0.92)",
              border: "1px solid rgba(148,163,184,0.35)"
            }}
          >
            <h2
              style={{
                fontSize: 15,
                fontWeight: 600,
                marginBottom: 10
              }}
            >
              Hasil Perhitungan
            </h2>

            {!result && (
              <p style={{ color: "#9ca3af", fontSize: 13 }}>
                Isi form di sebelah kiri lalu klik{" "}
                <strong>Hitung Peluang RNG</strong> untuk melihat hasil.
              </p>
            )}

            {result && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {result.warnings.length > 0 && (
                  <div
                    style={{
                      padding: "8px 10px",
                      borderRadius: 12,
                      backgroundColor: "rgba(220,38,38,0.1)",
                      border: "1px solid rgba(248,113,113,0.5)",
                      fontSize: 12,
                      color: "#fecaca"
                    }}
                  >
                    <strong>Perlu diperhatikan:</strong>
                    <ul style={{ margin: "6px 0 0 18px", padding: 0 }}>
                      {result.warnings.map((w, idx) => (
                        <li key={idx}>{w}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {result.valid && (
                  <>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))",
                        gap: 10
                      }}
                    >
                      <div
                        style={{
                          padding: "10px 12px",
                          borderRadius: 12,
                          backgroundColor: "rgba(15,23,42,0.9)",
                          border: "1px solid rgba(148,163,184,0.4)"
                        }}
                      >
                        <div
                          style={{
                            fontSize: 11,
                            color: "#9ca3af",
                            marginBottom: 2
                          }}
                        >
                          Peluang per cast {fishLabel}
                        </div>
                        <div
                          style={{
                            fontSize: 20,
                            fontWeight: 700
                          }}
                        >
                          {formatPercent(result.singleChancePct)}
                        </div>
                      </div>

                      <div
                        style={{
                          padding: "10px 12px",
                          borderRadius: 12,
                          backgroundColor: "rgba(15,23,42,0.9)",
                          border: "1px solid rgba(148,163,184,0.4)"
                        }}
                      >
                        <div
                          style={{
                            fontSize: 11,
                            color: "#9ca3af",
                            marginBottom: 2
                          }}
                        >
                          Peluang minimal 1x drop (N cast)
                        </div>
                        <div
                          style={{
                            fontSize: 20,
                            fontWeight: 700
                          }}
                        >
                          {formatPercent(result.cumulativeChancePct)}
                        </div>
                      </div>

                      <div
                        style={{
                          padding: "10px 12px",
                          borderRadius: 12,
                          backgroundColor: "rgba(15,23,42,0.9)",
                          border: "1px solid rgba(148,163,184,0.4)"
                        }}
                      >
                        <div
                          style={{
                            fontSize: 11,
                            color: "#9ca3af",
                            marginBottom: 2
                          }}
                        >
                          Saran respawn setelah
                        </div>
                        <div
                          style={{
                            fontSize: 20,
                            fontWeight: 700
                          }}
                        >
                          {result.respawnAfter
                            ? `${result.respawnAfter} cast`
                            : "-"}
                        </div>
                        <div
                          style={{
                            marginTop: 2,
                            fontSize: 10,
                            color: "#6b7280"
                          }}
                        >
                          Ini hanya patokan komunitas. Secara matematika, RNG
                          tetap acak & tidak punya memori.
                        </div>
                      </div>
                    </div>

                    <div
                      style={{
                        marginTop: 4,
                        padding: "8px 10px",
                        borderRadius: 12,
                        backgroundColor: "rgba(15,23,42,0.9)",
                        border: "1px solid rgba(55,65,81,0.7)",
                        fontSize: 12.5
                      }}
                    >
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          marginBottom: 4
                        }}
                      >
                        Langkah Selanjutnya
                      </div>
                      {result.steps.length === 0 ? (
                        <p style={{ color: "#9ca3af" }}>
                          Tidak ada saran khusus. Periksa kembali input kamu.
                        </p>
                      ) : (
                        <ul
                          style={{
                            margin: 0,
                            paddingLeft: 18,
                            color: "#d1d5db"
                          }}
                        >
                          {result.steps.map((s, idx) => (
                            <li key={idx} style={{ marginBottom: 4 }}>
                              {s}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </section>

        <footer
          style={{
            marginTop: 20,
            fontSize: 11,
            color: "#6b7280",
            textAlign: "right"
          }}
        >
          Dibuat untuk komunitas Fish It (Roblox) – model RNG fan-made, bukan
          resmi dari developer.
        </footer>
      </div>
    </main>
  );
}
