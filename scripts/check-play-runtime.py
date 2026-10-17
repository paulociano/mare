#!/usr/bin/env python3
"""MARÉ Play System: browser regression across twelve real HTML pages.

Requirements (CI only): playwright==1.56.0 and Chromium.
Runs against built _site, not mocks or screenshots standing in for gameplay.
"""
from __future__ import annotations

import http.server
import json
import threading
import time
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
SITE = ROOT / "_site"
CAPTURES = ROOT / "playwright-artifacts"
PAGES = [
    "recife", "abismo", "cardume", "corrente", "concha", "trilha",
    "enigma", "marujo", "forca", "criptograma", "perola", "farol",
]
SIZES = [("mobile", 390, 844), ("desktop", 1440, 900)]
KEYS = [".mare-skip-link", "h1", "main", ".mare-game-nav"]


class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(SITE), **kwargs)

    def log_message(self, fmt, *args):
        return


def check():
    if not SITE.joinpath("index.html").is_file():
        raise RuntimeError("Build _site ausente: execute npm run build antes do QA")
    CAPTURES.mkdir(exist_ok=True)
    srv = http.server.ThreadingHTTPServer(("127.0.0.1", 0), QuietHandler)
    thread = threading.Thread(target=srv.serve_forever, daemon=True)
    thread.start()
    base = f"http://127.0.0.1:{srv.server_port}/"
    findings = []
    results = []
    started = time.monotonic()
    try:
        with sync_playwright() as pw:
            browser = pw.chromium.launch(headless=True, args=["--disable-dev-shm-usage"])
            try:
                for device, width, height in SIZES:
                    context = browser.new_context(
                        viewport={"width": width, "height": height},
                        device_scale_factor=1,
                        reduced_motion="reduce",
                        color_scheme="dark",
                        locale="pt-BR",
                    )
                    for page_name in PAGES:
                        page = context.new_page()
                        errors = []
                        page.on("pageerror", lambda error: errors.append(str(error)))
                        target = f"{base}{page_name}.html"
                        try:
                            response = page.goto(target, wait_until="domcontentloaded", timeout=20000)
                            page.wait_for_timeout(350)
                            if not response or response.status != 200:
                                findings.append(f"{device} {page_name}: HTTP {response.status if response else 'none'}")
                            # Real rendered DOM/viewport checks.
                            observed = page.evaluate("""() => ({
                                headings: document.querySelectorAll('h1').length,
                                title: document.querySelector('h1')?.textContent?.trim() || '',
                                skip: !!document.querySelector('.mare-skip-link[href="#conteudo-principal"]'),
                                main: !!document.querySelector('main#conteudo-principal'),
                                footer: document.querySelectorAll('.mare-game-nav__link').length,
                                scrollWidth: document.documentElement.scrollWidth,
                                viewport: window.innerWidth,
                                display: getComputedStyle(document.querySelector('main')).display,
                                css: [...document.styleSheets].some(s => s.href?.includes('mare-play.css'))
                            })""")
                            if observed["headings"] != 1:
                                findings.append(f"{device} {page_name}: {observed['headings']} H1")
                            if not observed["skip"] or not observed["main"]:
                                findings.append(f"{device} {page_name}: landmark/skip ausente")
                            if observed["footer"] != 12:
                                findings.append(f"{device} {page_name}: navegação contém {observed['footer']} jogos")
                            if observed["scrollWidth"] > observed["viewport"] + 3:
                                findings.append(f"{device} {page_name}: overflow horizontal {observed['scrollWidth']} > {observed['viewport']}")
                            if not observed["css"]:
                                findings.append(f"{device} {page_name}: Play CSS não carregado")
                            skip = page.locator(".mare-skip-link")
                            before_focus = skip.evaluate("(el) => el.getBoundingClientRect().bottom")
                            if before_focus > 0:
                                findings.append(f"{device} {page_name}: skip link está visível sem foco")
                            skip.focus()
                            focused = skip.evaluate("(el) => ({active: document.activeElement === el, top: el.getBoundingClientRect().top})")
                            if not focused["active"] or focused["top"] < 0:
                                findings.append(f"{device} {page_name}: skip link não aparece quando recebe foco")
                            skip.blur()

                            if errors:
                                findings.append(f"{device} {page_name}: JS exception: {errors[:2]}")
                            page.screenshot(path=str(CAPTURES / f"{page_name}-{device}.png"), animations="disabled")
                            results.append({"page": page_name, "device": device, **observed, "jsErrors": errors})
                        except Exception as exc:
                            findings.append(f"{device} {page_name}: browser error: {type(exc).__name__} {exc}")
                        finally:
                            page.close()
                    context.close()
            finally:
                browser.close()
    finally:
        srv.shutdown()
        srv.server_close()
    report = {
        "count": len(results), "expected": len(PAGES) * len(SIZES),
        "seconds": round(time.monotonic() - started, 2),
        "findings": findings, "screens": results,
        "browser": "Chromium, reduced-motion, local built _site",
        "limits": "Viewport and DOM smoke only; not WCAG certification or Core Web Vitals.",
    }
    (CAPTURES / "report.json").write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf8")
    print(f"Browser QA: {len(results)} of {len(PAGES) * len(SIZES)} screens; {len(findings)} findings")
    for item in findings:
        print("FAIL:", item)
    if findings:
        raise SystemExit(1)
    print("PASS: 12 games across mobile and desktop; no horizontal overflow or page exceptions")


if __name__ == "__main__":
    check()
