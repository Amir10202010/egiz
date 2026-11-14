# Environment supplement env-0.1.0 (Earth surface temperature and precipitation)

Written with AI assistance (Claude Code); human review pending. 14 November 2026.

## Why

The engine attributes `t_min_c`, `t_max_c` and `precip_mm` are defined in `docs/science/MATHEMATICAL_SPECIFICATION.md` §3 as MODIS land-surface temperature (P5 night / P95 day, 2015–2024) and GPM IMERG annual precipitation. Release geo-0.1.0 carries only modelled air temperature (`t2m_*`) and NASA POWER precipitation, which the ML layer deliberately does not substitute. This supplement provides the spec-defined values for the same AOIs.

## How it is produced

```bash
earthengine authenticate                        # once, by the account owner
python tools/acquire_env_supplement.py --project <EE project> \
    --geo data/geo/geo-0.1.0 --out data/env/env-0.1.0 --batch 8
```

- Computation is the existing `pipeline/earth/gee_env.py:environment` (unchanged method). Geometry: each Earth AOI's 22 km `footprint.ring_lonlat`.
- `t_min_c`: MOD11A2 + MYD11A2 `LST_Night_1km`, QA bits 0–1 = 0, per-pixel 5th percentile over 2015–2024, footprint mean at 1 km. `t_max_c`: same with `LST_Day_1km`, 95th percentile.
- `precip_mm`: IMERG V07 monthly rate × hours, annual sums 2001–2024, mean of years, footprint mean at 11 km.
- Earth Engine land cover is computed by the same function but **discarded**; land cover stays ESA WorldCover from the release.
- Batches larger than ~10 AOIs exceed the Earth Engine user memory limit (40 failed).
- Output `data/env/env-0.1.0/environment.json` is bound to the release by the SHA-256 of `aoi_catalog.json`; the ML loader refuses a mismatched supplement. Missing values stay `null` with a reason.

## Bug fixed in `pipeline/earth/gee_env.py`

`reduceRegions` with `ee.Reducer.mean()` on a single-band image names the output property `mean`, not the band. The precipitation image has one band, so `precip_mm` was silently dropped for every AOI (the 5-AOI test returned 5/5 missing). Fixed by `ee.Reducer.mean().setOutputs(["precip_mm"])`. This file belongs to the Earth/geo owner — please review.

## Result env-0.1.0 (acquired 14 November 2026)

All 329 Earth AOIs were processed. There are 67 missing values: `t_min_c` is missing for 34 AOIs and `t_max_c` for 33. `precip_mm` is present for every AOI.

| Attribute | min | median | max |
| --- | --- | --- | --- |
| `t_min_c` | −56.0 (SM_W040.440_N72.425, Greenland) | −3.6 | 21.5 |
| `t_max_c` | −9.8 | 42.5 | 61.7 (SM_E059.364_N27.342, Iran) |
| `precip_mm` | 1.5 (SM_W036.765_N78.528, Greenland) | 313.7 | 4985 |

33 AOIs have ≤ 50 mm per year. The driest non-ice AOIs are in the eastern Sahara (SM_E026.503_N23.454, 3.1 mm).

The 34 AOIs without temperature fall into two groups. The record keeps the same generic reason for both; a more specific reason is a TODO.

- **Water footprints (21).** There are 18 L1_dem AOIs without land cover, 2 L2 AOIs with `water_frac` = 1.0, and SM_W098.433_N68.589 (L4, `water_frac` 0.999). They include offshore or coastal points such as SM_W070.725_S20.363 off Chile and SM_E039.494_N19.478 in the Red Sea. MODIS LST is a land product, so missing is correct here. **For the geo lead:** these AOIs lie largely over sea.
- **Arid land (13 L4 AOIs in Australia, Patagonia, Andes foothills and the Karoo).** A 2020 MOD11A2 check at SM_E133.756_S30.475 gave 0 % of night pixels with QA bits 0–1 = 00 ("good") and 99.6 % with 01 ("produced, other quality", typically emissivity uncertainty). The QA filter in `gee_env.py` keeps 00 only, so every pixel is dropped. The specification does not name a QA rule. **For the science lead:** decide whether QA 01 is acceptable. Until then these values stay missing and are not substituted.

Inference (`artifacts/ml/discovery-env`, not committed): rankings for O1–O4 and M1–M3 are identical to geo-only, as expected, because none of them uses these attributes. O5 and M4 still have 0 eligible AOIs. `precip_mm` now scores (for example, fidelity 1.0 at 1.5 mm), but the target `t_min_c` is missing, so 2 of 6 weight units are absent, which is above the 0.3 cut.

## Using it

```bash
python -m pipeline.ml infer --geo data/geo/geo-0.1.0 --env data/env/env-0.1.0 --out artifacts/ml/discovery-env
```

## Still missing: target temperatures

`colder` compares Earth `t_min_c` with the **target's** `t_min_c`. `data/curated/targets.csv` has the columns but no values (owned by the science lead, with citation). Until they exist, `t_min_c` contributes nothing and the cold/dry objectives O5 and M4 remain non-computable (missing weight 2/6 > 0.3). Candidate sources: LRO Diviner polar temperature products (Moon), Mars 2020 MEDA ground temperature and the Mars Climate Database (Jezero).

Source search, 14 November 2026. No values were taken; nothing below is a number for `targets.csv`:

- Moon, Mons Mouton (85.43° S, 31.74° E): the right product is the LRO Diviner polar resource maps (annual max, min and average bolometric temperature at 240 m per pixel, PDS Geosciences node), sampled over the Site20 extent. The Diviner paper found on the web, Williams et al. 2024, *The Faustini Permanently Shadowed Region on the Moon*, PSJ 5(9), doi:10.3847/psj/ad6f0d, covers Faustini, not Mons Mouton, so it cannot be cited for this target.
- Mars, Jezero: MEDA TIRS ground temperature. The candidate sources are Martínez et al. 2023, JGR Planets (surface energy budget, albedo and thermal inertia at Jezero), and Martínez et al. 2025, EPSC-DPS2025-1461, doi:10.5194/epsc-dps2025-1461 (data through sol 1450). In the abstract, daily min and max are only shown in Fig. 3a, so the values should come from the PDS MEDA archive or the paper text, not from reading the figure.
- Definition to match the Earth side: for `t_min_c`, use a low percentile of the night or annual minimum surface temperature; for `t_max_c`, use a high percentile of the daytime maximum. Record the `_lo`/`_hi` bounds with the source key.

Note for the Moon: polar lunar night temperatures are far below anything on Earth's surface, so with τ = 30 °C an absolute `colder` comparison will be ≈ 0 for every Earth AOI. The science lead should decide whether lunar cold is treated as a physical gap (like vacuum) or ranked relatively.
