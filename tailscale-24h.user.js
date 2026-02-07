// ==UserScript==
// @name         Tailscale 24-Hour Time Format (improved)
// @namespace    Violentmonkey Scripts
// @version      1.2
// @description  Конвертује AM/PM у 24-часовни формат и GMT у UTC на Tailscale сајту
// @author       crnobog
// @match        https://login.tailscale.com/*
// @match        https://*.tailscale.com/*
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function () {
  'use strict';

  function convertTo24Hour(input) {
    if (!input) return input;

    let result = String(input);

    // AM/PM -> 24h (нпр. "3:45 PM" -> "15:45")
    const timeRegex = /(\d{1,2}):(\d{2})\s*(AM|PM)\b/gi;
    result = result.replace(timeRegex, (match, hh, mm, ap) => {
      let h = parseInt(hh, 10);
      const period = ap.toUpperCase();
      if (period === 'PM' && h !== 12) h += 12;
      if (period === 'AM' && h === 12) h = 0;
      return `${String(h).padStart(2, '0')}:${mm}`;
    });

    // GMT са офсетом -> UTC са истим офсетом:
    // хвата: "GMT+1", "GMT + 1", "GMT+01:00", "GMT+0100", "GMT-0530", "GMT-5:30"
    const gmtOffsetRegex = /\bGMT\s*([+-])\s*(\d{1,2})(?:(?::?\s*(\d{2})))?/gi;
    result = result.replace(gmtOffsetRegex, (m, sign, hRaw, minRaw) => {
      const h = String(parseInt(hRaw, 10)); // без водећих нула, да остане стил "UTC+1"
      const mins = (minRaw != null) ? String(parseInt(minRaw, 10)).padStart(2, '0') : null;

      // ако су минуте присутне, форматирај као UTC+5:30 или UTC+5:00 итд.
      if (mins !== null) {
        // ако је оригинал био GMT+0100, ово ће постати UTC+1:00 (читљивије)
        return `UTC${sign}${h}:${mins}`;
      }
      return `UTC${sign}${h}`;
    });

    // Чист "GMT" (без офсета) -> "UTC"
    result = result.replace(/\bGMT\b/gi, 'UTC');

    return result;
  }

  function shouldSkipNode(node) {
    if (!node || node.nodeType !== Node.ELEMENT_NODE) return false;
    const tag = node.tagName;
    return tag === 'SCRIPT' || tag === 'STYLE' || tag === 'NOSCRIPT' || tag === 'TEXTAREA' || tag === 'INPUT';
  }

  function processTextNode(textNode) {
    const original = textNode.nodeValue;
    const converted = convertTo24Hour(original);
    if (converted !== original) textNode.nodeValue = converted;
  }

  function processElementAttributes(el) {
    const attrs = ['title', 'aria-label', 'data-time', 'datetime'];
    for (const attr of attrs) {
      if (el.hasAttribute && el.hasAttribute(attr)) {
        const original = el.getAttribute(attr);
        const converted = convertTo24Hour(original);
        if (converted !== original) el.setAttribute(attr, converted);
      }
    }
  }

  function processSubtree(root) {
    if (!root) return;

    // Ако је текст чвор директно
    if (root.nodeType === Node.TEXT_NODE) {
      processTextNode(root);
      return;
    }

    // Ако је елемент
    if (root.nodeType === Node.ELEMENT_NODE) {
      if (shouldSkipNode(root)) return;
      processElementAttributes(root);
    }

    // Прођи кроз све текст чворове испод root (брже и поузданије од рекурзије по childNodes)
    const walker = document.createTreeWalker(
      root,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          const parent = node.parentElement;
          if (parent && shouldSkipNode(parent)) return NodeFilter.FILTER_REJECT;
          return NodeFilter.FILTER_ACCEPT;
        }
      }
    );

    let n;
    while ((n = walker.nextNode())) {
      processTextNode(n);
    }

    // И обради атрибуте на елементима у подстаблу (ограничено: само кад су мутације/иницијално)
    if (root.nodeType === Node.ELEMENT_NODE) {
      const els = root.querySelectorAll ? root.querySelectorAll('[title],[aria-label],[data-time],[datetime]') : [];
      for (const el of els) processElementAttributes(el);
    }
  }

  // Иницијална обрада
  processSubtree(document.body);

  // Посматрач: хвата додавања, промене текста и промене атрибута
  const observer = new MutationObserver((mutations) => {
    for (const m of mutations) {
      if (m.type === 'childList') {
        m.addedNodes.forEach((node) => processSubtree(node));
      } else if (m.type === 'characterData') {
        processTextNode(m.target);
      } else if (m.type === 'attributes') {
        const el = m.target;
        processElementAttributes(el);
      }
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: true,
    // ако хоћеш још агресивније, уклони attributeFilter да прати све атрибуте
    attributeFilter: ['title', 'aria-label', 'data-time', 'datetime']
  });

  console.log('Tailscale 24-Hour Time Format скрипта је активна (improved)');
})();
