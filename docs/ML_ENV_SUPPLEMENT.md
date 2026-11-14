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
