"""Command line: ``python -m pipeline.ml validate-data|infer``.

Written with AI assistance (Claude Code); human review pending.
"""

from __future__ import annotations

import argparse
import json
import sys

from pipeline.contracts.validate import ContractError

from .export import build_documents, write_documents
from .geo import load_geo_snapshot
from .loader import load_snapshot, summary


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(prog="python -m pipeline.ml")
    sub = parser.add_subparsers(dest="command", required=True)
    for name in ("validate-data", "infer"):
        p = sub.add_parser(name)
        p.add_argument("--data", default="data/pilot", help="contract snapshot (targets, templates, sun)")
        p.add_argument("--geo", help="geospatial release directory; its Earth AOIs replace the candidates")
        p.add_argument("--env", help="environment supplement directory (MODIS LST, IMERG) for --geo")
        p.add_argument("--ids", nargs="*", help="restrict to these AOI IDs")
        p.add_argument("--limit", type=int, help="first N candidates in ID order")
    infer = sub.choices["infer"]
    infer.add_argument("--out", default="artifacts/ml/discovery")
    infer.add_argument("--draws", type=int, help="stability perturbation draws")
    infer.add_argument("--seed", type=int, help="stability seed")
    infer.add_argument("--created-at", help="fixed timestamp for reproducible output")
    patches = sub.add_parser("patches", help="cut verified 50 m DEM grids into encoder tiles")
    patches.add_argument("--geo", default="data/geo/geo-0.1.0")
    patches.add_argument("--grids", required=True, help="directory with <aoi>_p50.tif grids")
    patches.add_argument("--out", default="artifacts/ml/patches-0.1.0")
    patches.add_argument("--size", type=int, default=64)
    patches.add_argument("--stride", type=int, default=64)
    args = parser.parse_args(argv)
    if args.command == "patches":
        from .patches import build_patches

        result = build_patches(args.geo, args.grids, args.out, size=args.size, stride=args.stride)
        print(json.dumps({k: result[k] for k in ("counts", "split", "gate")}, indent=1))
        print(f"skipped: {len(result['skipped'])}")
        return 0
    try:
        if args.geo:
            snapshot = load_geo_snapshot(args.geo, args.data, ids=args.ids, limit=args.limit, env_dir=args.env)
        else:
            snapshot = load_snapshot(args.data, ids=args.ids, limit=args.limit)
    except ContractError as error:
        print(f"invalid snapshot: {error}", file=sys.stderr)
        return 2
    if args.command == "validate-data":
        print(json.dumps(summary(snapshot), indent=2))
        return 0
    config = {}
    if args.draws is not None:
        config["stability_draws"] = args.draws
    if args.seed is not None:
        config["stability_seed"] = args.seed
    docs = build_documents(snapshot, config, created_at=args.created_at)
    paths = write_documents(docs, args.out)
    for doc, path in zip(docs, paths):
        top = [c["aoi_id"] for c in doc["candidates"] if c["rank"] is not None][:3]
        print(f"{path.as_posix()}: {doc['mission_profile']['id']} eligible={doc['dataset']['eligible_count']} "
              f"top={top}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
