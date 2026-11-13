# Audit: Brookhaven, for the projects page

**Audited:** 2026-11-13, `~/Github/Brookhaven` at `main` (9 commits, last commit 2026-11-11), and the gitignored outputs in `~/Public/report_Nov_12/` (1.2 GB: 8 Runs, the generated reports, `presentation.tex`, dated 7 Nov 2026)
**Repo:** <https://github.com/Rajnoor-Brar/Brookhaven> (public, GPL-3.0, no GitHub description, `README.md` is one line)
**Goal:** decide whether and how Brookhaven goes on rajnoor.in/projects, and what the page may claim.
**Depends on:** [Heimdall audit](2026-11-13-heimdall.md). Brookhaven is a Heimdall work dir.

## Verdict

Put it on the site, as the physics study that shows Heimdall in use, but frame it as **a validation in progress**, not a set of results. The ZEUS validation of Pythia 8 is real work with honest numbers. The EIC predictions, as they stand, **do not use what the validation found**, and Sherpa's statistics are too weak to support its rankings. The page can show both, provided it says so. Leading with "EIC predictions" would overclaim.

## What it is (verified)

- **Physics.** Inclusive-jet photoproduction (a quasi-real photon, Q² < 1 GeV², from the lepton hits the proton), in two studies (`configs/eic/README.md`):
  - **ZEUS validation:** e⁺p at HERA, 27.5 × 920 GeV (√s = 318 GeV), against ZEUS 2012 (`ZEUS_2012_I1116258`; reference data from HEPData, `doi:10.17182/hepdata.62400.v1`, in `datasets/zeus_eic.yoda`). Pythia 8.318 and Sherpa 3.0.5 into Rivet.
  - **EIC predictions:** e⁻p at the EIC's 8 beam settings (5–18 GeV electrons on 130 or 275 GeV protons; √s 51–141 GeV), with a custom Rivet analysis `photo_eic`. There is no data to compare with, so these are plots only.
- **Sweeps run** (`~/Public/report_Nov_12/`, as reported by each summary):
  - Pythia at HERA: 4 proton PDFs × pT0Ref 3.0–4.0 GeV × lepton QED shower on/off × lepton PDF on/off = 96 points, 288 pages scored against ZEUS.
  - Sherpa at HERA: 8 PDFs × FastjetFinder ΔR (0.1–6.4) = 56 points; a ΔR × jet-algorithm variant has 78.
  - Pythia at the EIC: 11 PDFs × 8 beam settings = 88 points.
  - Sherpa at the EIC: polarisation (unpolarised, 65, 70, 75 %) × 8 beam settings = 32 points, run twice.
  - 1 M events a point.
- **Code that is the user's own:** `modules/PhotoProduction/Rivet/photo_eic.cc` (216 lines; a ZEUS-style analysis whose cuts are options so one plugin serves every beam setting), the TOML errands and cards in `configs/eic/`, and seven report recipes.
- **Presentation:** a 1,396-line Beamer deck, "PDF and parameter validation of Pythia 8 and Sherpa 3: ZEUS photoproduction, then EIC predictions", IIT Mandi, 7 Nov 2026. It explains the ranking method well and states its own Sherpa caveat.

## Headline results, as numbers (from `statistics.csv`, the deck's run)

| | Value | Source |
|---|---|---|
| Best Pythia point | MSTW 2008 LO 68, pT0Ref 3.8, lepton QED shower off, lepton PDF on: loss 0.80 against 0.90 for the runner-up | deck p. "top 8"; `01_pythia_pdf_ptref_qed_lepton` |
| Its agreement with ZEUS, median over 12 observables | yield ratio **1.13** (0.99–1.19), χ²/ndf **4.7** | `statistics.csv` |
| Lepton PDF on vs off (marginal) | ×0.91 vs ×1.10: about 22 % lower loss with it on | deck |
| Same point with the lepton PDF off | yield ratio **0.80**, χ²/ndf 15.5 | `statistics.csv` |
| pT0Ref | 3.2–3.8 GeV all within 2 SE: loosely constrained | deck |
| Sherpa vs Pythia statistics, median over pages | yield error 15.8 % vs 0.9 %; n_eff **22** vs 14,178 | deck |

## Real problems (by impact)

1. **The EIC Pythia predictions do not use the validated configuration, and they lack the direct photon contribution.** The ZEUS study's clearest finding is that the lepton PDF must be on. `configs/eic/zeus_pythia.toml:41-42` says why: with `PDF:lepton2gamma`, `PDF:lepton = off` "leaves the direct processes no photon: σ_direct = 0". The data agree: the best point falls from a yield ratio of 1.13 to 0.80 when the lepton PDF is switched off. Yet `configs/eic/photo.cmnd:31` sets `PDF:lepton = off`, and the deck's "EIC Pythia baseline" lists it so. The EIC Pythia curves are therefore **resolved-only**. They leave out a component that the ZEUS scan puts at about 30 % of the cross-section (the yield ratio drops from 1.13 to 0.80), and that typically weighs more at high E_T and in the photon direction. `photo.cmnd:20-21` even notes that "the direct contribution needs its own card". **Fix:** set `PDF:lepton = on` in `photo.cmnd`, then rerun `eic/photoproduction pythia_pdfs_energies`. Until then the page must not present these curves as EIC predictions of the inclusive cross-section.
   - *Rechecked on 2026-11-13*, after the developer said the report folder has lepton-PDF-on runs. Those runs are the ZEUS ones (`01_pythia_pdf_ptref_qed_lepton`, whose `lpdfon` points use `zeus.cmnd:27`, `PDF:lepton = on`). The folder's only EIC Pythia run, `01_pythia_pdfs_energies`, has it off in all three records: its own recorded card (`reports/eic/photoproduction/01_pythia_pdfs_energies/tools/01_What_was_run/01_01_pythia_pdfs_energies/pythia.baseline.cmnd:12`), the deck's "EIC Pythia baseline" frame (`presentation.tex:657`), and `configs/eic/photo.cmnd:31`. Its points carry no lepton axis. The EIC run was also written *after* the ZEUS lepton scan (14:30 against 05:45 UTC on 2026-11-12), so the page no longer says it predates the finding.
2. **The Sherpa results are noise-dominated, and the deck still draws conclusions from them.** With weighted MC@NLO events, the median effective sample is **n_eff ≈ 22 from 10⁶ events** at HERA, and ≈ 20 or ≈ 160 in the two EIC polarisation Runs. The deck says the ranking is unreliable, then concludes "Choice: ΔR = 0.8" from the marginals. The ΔR marginal is non-monotonic (0.2 ≈ best, 0.4 significantly worse, 0.8 best, 1.6 ≈ best, 3.2 worse), which is what noise looks like. **Fix:** generate unweighted (`EVENT_GENERATION_MODE: Unweighted`) or partially unweighted events, or integrate harder, then rerun. Do not publish the ΔR or PDF choice as a finding.
3. **ΔR is a generation cut, not a tune.** The swept `FastjetFinder: DR` (`configs/eic/zeus.yaml`, `SELECTORS`) is a matrix-element **selector**: a phase-space cut at generation, not the analysis jet radius (ZEUS uses k_T, R = 1). Ranking a generation cut by its agreement with data mixes a technical cut with physics. A selector should be loose enough not to bias the analysis cuts (here E_T > 17 GeV, R = 1), then shown not to matter. **Fix:** pick the selector by an insensitivity check, and drop it from the ranking.
4. **The bin errors of weighted Sherpa samples look underestimated.** A longitudinally polarised electron on an **unpolarised** proton, through parity-conserving photon exchange at Q² < 1 GeV², should change nothing. The Sherpa EIC Run shows d01 yields at 5×130 of 233 ± 14 (65 %), 268 ± 10 (70 %), 291 ± 8 (75 %) and 241 ± 10 pb (unpolarised): a 50 pb gap between 75 % and unpolarised, about 3.7σ on the quoted errors, and non-monotonic in P_e. The likely reading is that the errors are too small for heavy-tailed weights, not that polarisation matters. **Fix:** treat the polarisation sweep as a null check, report it as such, and check the error model on a seed sweep. Do not publish a "polarisation dependence".
5. **The two generators are not compared like for like.** Sherpa runs the **resolved part only, with no MPI** (`MI_HANDLER: None`, process `93 93 → 93 93`). Pythia runs direct + resolved **with** MPI at HERA. The README does flag the resolved/direct difference. But the deck's "Same observable, two generators" slide and any Pythia-vs-Sherpa plot invite a reading as a generator comparison. They compare two different physics contents.
6. **A reversed inequality in a published figure label.** `configs/eic/zeus_plot.toml:5` sets `LegendTitle=$-1 > \eta > 2.5, k_T$ alg`. It should read `-1 < \eta < 2.5`, and it renders on every ZEUS d01 page (seen in `ptref_by_pdf_lepton/mpl/MSTW08lo_qedLoff_lpdfon/d01-x01-y01.png`). One-character fix; redraw with `heimdall plot` (no rerun).
7. **`photo_eic.cc` bins charged-particle η in a different frame from jet η.** Jets fill `orientation*jet.eta()` (the proton direction is +η, the ZEUS convention), but charged particles fill `_h_13->fill(p.eta())` (`photo_eic.cc`, the CFS loop) without the orientation. Brookhaven puts the electron along +z (`common.toml`), so d17 is mirrored relative to every jet-η page. **Fix:** `_h_13->fill(orientation*p.eta())`, then rerun or document it.

## Questionable decisions

- **"Best" is not "good".** The ranking's top Pythia point still sits 13 % above ZEUS in normalisation with a median χ²/ndf of 4.7, and the deck's own convention reads loss ≲ 1 as "within thresholds". On a public page, "best of the scan" must not slide into "describes the data".
- **The leaderboard was trimmed after the fact.** The deck's top-8 tables keep three pT0Ref values (and three ΔR values) "ranks recounted", while the marginals use all points. If this was for space, say so on the slide. As shown, it reads as selection.
- **NLO and NNLO proton PDFs in a LO + shower generator** are expected to do worse with Pythia's LO-tuned MPI. The PDF ranking confirms a known expectation; it does not discover anything.
- **The repo still carries dead layers.** `HEIMDALL.md` cites retired names (`hep deck`, `setup.sh`, `docs/framework/01_Target.md`). `decks/batch_1/deck.toml` points at `PhotoProduction/zeus` folders removed on 2026-11-11. `configs/eic/photoproduction.toml` still uses `plot_points`, which Heimdall decided to retire. `configs/legacy/` holds 26 files. None of this breaks anything, but a visitor following the page's GitHub link sees an empty README and stale docs first.
- **Outputs live only in `~/Public/report_Nov_12`**, outside git and outside the work dir, beside `.bak` and `.format1` files. Nothing published links back to them. Archive the figures the page uses (they are copied into this site's `assets/resources/Brookhaven/`) and the report PDFs somewhere durable.

## Privacy and publishing

- `literature/README.md` lists files named after third parties, including what looks like a student roll number (`…V23107_AbhasRathi.pdf`) and a supervisor's surname. **Do not reproduce these names on the site** without their consent. The page cites the published ZEUS paper only.
- The deck is authored "Rajnoor Singh", while the site says "Rajnoor Brar". Use the site's name, and say the talk was given at IIT Mandi (already public on the About page).
- The ZEUS data are public (HEPData). All the figures are the user's own renders.

## Claims ledger for the page

| Safe to say | Evidence |
|---|---|
| Pythia 8 and Sherpa 3 photoproduction scanned against ZEUS 2012 inclusive jets: 96 Pythia points, 56 Sherpa points, 10⁶ events each | summaries |
| The lepton PDF (which supplies the direct photon) is the decisive Pythia switch: about 22 % lower loss, and without it the yield falls to 0.8 of data | marginals, `statistics.csv` |
| pT0Ref is only loosely constrained between 3.2 and 3.8 GeV | marginals |
| The best Pythia point overshoots ZEUS by about 13 % in normalisation | `statistics.csv` |
| Sherpa's weighted samples carried about 22 effective events, so its rankings are not reliable | deck, `statistics.csv` |
| EIC curves at 8 beam settings and 11 PDFs, made with a custom Rivet analysis | Runs |

| Do not say | Why |
|---|---|
| "EIC predictions for inclusive-jet photoproduction" (unqualified) | direct component missing (problem 1) |
| "ΔR = 0.8 is optimal" / "NNPDF 2.3 LO is the best PDF for Sherpa" | noise (problems 2, 3) |
| "polarisation dependence of the cross-section" | expected null; spread consistent with understated errors (problem 4) |
| "Pythia describes the ZEUS data" | χ²/ndf ≈ 4.7 at best |

## Assets for the page (picked from `~/Public/report_Nov_12`)

| Figure | File | Shows |
|---|---|---|
| pT0Ref scan against ZEUS, dσ/dE_T (d01) | `01_pythia_pdf_ptref_qed_lepton/plots/ptref_by_pdf_lepton/mpl/MSTW08lo_qedLoff_lpdfon/d01-x01-y01.png` | the MPI scale barely moves the low E_T bins; data vs MC ratio panel |
| Lepton PDF off vs on (same PDF, pT0Ref) | the matching `…_lpdfoff/d01` page | the direct-photon normalisation effect |
| Sherpa beside Pythia at d01 | from `figures/` (PDF → PNG) | the noise difference |
| EIC energies, Pythia, d01 | `01_pythia_pdfs_energies/plots/…` | eight beam settings, with the caveat |

The eta-label typo (problem 6) is baked into the ZEUS d01 PNGs, so the captions say what the cut is.

## Page plan

- **Group:** `simulations`, weight 20, after Heimdall.
- **Tags:** `HEP`, `Monte Carlo`, `C++`, `Rivet`.
- **Card:** "Brookhaven": "Jet photoproduction with Pythia 8 and Sherpa 3, validated against ZEUS data at HERA, then carried to the Electron-Ion Collider."
- **Sections:** The question → The setup → Validation against ZEUS (figures, numbers) → What the scan says → Sherpa: why its rankings don't count → Towards the EIC (caveat) → What's next (problems 1–4 as the to-do list) → Links.

## Verification log

| Check | Result |
|---|---|
| Read `configs/eic/*`, `photo.cmnd`, `zeus.cmnd`, `zeus.yaml`, `zeus_pythia.toml`, `photo_eic.cc` | problems 1, 3, 5, 6, 7 traced to file and line |
| Recomputed medians from `statistics.csv` (yield ratio, χ²/ndf, n_eff) for the deck's best Pythia point, its lepton-PDF-off twin, and the Sherpa Runs | numbers in the tables above |
| Compared d01 areas across polarisations in `02_polarisation_energies` | problem 4's numbers |
| Opened rendered pages (`d01` pT0Ref scan, ranking summary p.1) | label typo seen; summary shows 6 categories (the deck: 5, as the engine changed after 7 Nov) |
| Did **not** rerun anything | Heimdall's environment does not load on this machine (see the Heimdall audit, problem 3) |

## Outcome (2026-11-13)

Built: `content/projects/brookhaven.html`, an entry in `data/projects.yaml` (group `simulations`, weight 20), and five figures plus a card crop in `assets/resources/Brookhaven/`. The figures were re-rendered from the Runs' vector PDFs at 220 dpi, not taken from the 457 px PNGs. The page leads with the ZEUS validation, publishes the Sherpa ΔR/PDF choice as "not a finding", and marks the EIC curves as resolved-only. When problem 1 is fixed and the EIC sweep rerun, swap `eic_pythia_energies_d01.png` and drop the "Read with care" callout's first half.
