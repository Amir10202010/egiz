# Written with AI assistance (Codex); human review pending.
PYTHON ?= $(if $(wildcard .venv/bin/python),.venv/bin/python,$(if $(wildcard .venv/Scripts/python.exe),.venv/Scripts/python.exe,python3))
RUFF = $(PYTHON) -m ruff
PROJECT ?= $(EE_PROJECT)
EARTH_COUNT_PER_STRATUM ?= 1000
EARTH_OUT_DIR ?= data/processed
EARTH_ARGS ?=

.PHONY: setup fixtures data earth test check web dev offline serve clean atlas atlas-verify atlas-discover atlas-check world world-verify world-check

setup:
	python3 -m venv .venv
	.venv/bin/python -m pip install -r requirements.txt
	npm --prefix web ci

fixtures:
	$(PYTHON) tools/build_data.py --fixtures

data:
	$(PYTHON) tools/build_data.py

earth:
	$(PYTHON) -m pipeline.earth.acquire $(if $(strip $(PROJECT)),--project "$(PROJECT)",) --count-per-stratum $(EARTH_COUNT_PER_STRATUM) --out-dir "$(EARTH_OUT_DIR)" $(EARTH_ARGS)

test:
	$(PYTHON) -m pytest -q
	npm --prefix web test -- --run

science-build:
	$(PYTHON) -m pipeline.science.spice build
	node web/scripts/copy-data.mjs

science-fetch:
	$(PYTHON) -m pipeline.science.spice fetch

science-check:
	$(PYTHON) -m pytest -q tests/test_spice.py
	npm --prefix web test -- src/mission/engineering.test.ts src/mission/transfer.test.ts src/mission/openmctAdapter.test.ts

science-serve:
	$(PYTHON) -m pipeline.science.spice serve

check:
	$(PYTHON) tools/tasks.py validate
	$(RUFF) check pipeline tests tools/build_data.py tools/check_bundle.py tools/check_secrets.py tools/make_offline.py
	$(PYTHON) -m pytest -q
	$(PYTHON) tools/check_bundle.py
	$(PYTHON) tools/check_secrets.py
	npm --prefix web run typecheck
	npm --prefix web test -- --run
	npm --prefix web run build

web: data
	npm --prefix web run build

dev: data
	npm --prefix web run dev -- --host 127.0.0.1

offline: web
	$(PYTHON) tools/make_offline.py

serve:
	$(PYTHON) -m http.server 4173 --bind 127.0.0.1 --directory web/dist

clean:
	$(PYTHON) -c "import shutil; shutil.rmtree('web/dist', ignore_errors=True)"

# Optional native engines execute only when explicitly selected.
dynamics-build:
	$(PYTHON) -m pipeline.dynamics build
	node web/scripts/copy-data.mjs

dynamics-check:
	$(PYTHON) -m pytest -q tests/test_native_dynamics.py tests/test_native_service.py
	npm --prefix web test -- src/mission/dynamics.test.ts src/mission/robustCampaign.test.ts

terrain-build:
	$(PYTHON) -m pipeline.common.terrain_pyramid
	node web/scripts/copy-data.mjs

# ATLAS-Pi mission-conditioned transferability (additive; reads data/pilot only).
atlas:
	$(PYTHON) -m pipeline.analog_transfer build
	node web/scripts/copy-data.mjs

atlas-verify:
	$(PYTHON) -m pipeline.analog_transfer verify

atlas-discover:
	$(PYTHON) -m pipeline.analog_transfer discover

atlas-check:
	$(PYTHON) -m pytest -q tests/test_analog_transfer.py
	npm --prefix web test -- src/atlas

# EGIZ ASTRAL planetary world package (additive; reads data/raw/targets, writes data/world).
world:
	$(PYTHON) -m pipeline.world build
	node web/scripts/copy-data.mjs

world-verify:
	$(PYTHON) -m pipeline.world verify

world-check:
	$(PYTHON) -m pytest -q tests/test_world.py
	npm --prefix web test -- src/world src/studio

# Geospatial release (docs/GEOSPATIAL_DATA_INTERFACE.md). GEO_SCOPE=pilot|all; GEO_SAMPLE=N reselects sampled AOIs.
GEO_SCOPE ?= all
GEO_SAMPLE ?= 0
.PHONY: geo-audit geo-acquire geo-features geo-manifest geo-validate geo-illumination geo-test
geo-audit:
	$(PYTHON) -m pipeline.geodata audit
geo-acquire:
	$(PYTHON) -m pipeline.geodata acquire --scope $(GEO_SCOPE) --sample $(GEO_SAMPLE)
geo-features:
	$(PYTHON) -m pipeline.geodata features --scope $(GEO_SCOPE)
geo-manifest:
	$(PYTHON) -m pipeline.geodata manifest --scope $(GEO_SCOPE)
geo-illumination:
	$(PYTHON) -m pipeline.lighting.real_shadows
geo-validate:
	$(PYTHON) -m pipeline.geodata validate
geo-test:
	$(PYTHON) -m pytest -q pipeline/geodata
