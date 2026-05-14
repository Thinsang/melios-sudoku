"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

/**
 * Reads `?embed=1` from the URL and flips a `data-embed-mode` attribute
 * on <body> so a host site can iframe a game cleanly without our header
 * and footer eating their chrome.
 *
 * Usage from an iframe:
 *   <iframe src="https://meliogames.com/wordle?embed=1" />
 *
 * The CSS in globals.css picks up the attribute and hides header /
 * footer / "back to Melio Games" links. The game itself stays
 * untouched so it still works fully inside the embed.
 *
 * Server-rendered as null; the side effect only runs in the browser.
 */
export function EmbedMode() {
  const sp = useSearchParams();
  useEffect(() => {
    const embed = sp.get("embed") === "1";
    if (embed) {
      document.body.setAttribute("data-embed-mode", "1");
    } else {
      document.body.removeAttribute("data-embed-mode");
    }
  }, [sp]);
  return null;
}
