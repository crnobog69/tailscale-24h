// ==UserScript==
// @name         Tailscale 24-Hour Time Format
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

  function convertTo24Hour(text) {
    if (!text) return text;

    // "3:45 PM" / "11:30 AM" -> "15:45" / "11:30"
    const timeRegex = /(\d{1,2}):(\d{2})\s*(AM|PM)/gi;
    let result = text.replace(timeRegex, (match, hh, mm, ap) => {
      let h = parseInt(hh, 10);
      const p = ap.toUpperCase();
      if (p === 'PM' && h !== 12) h += 12;
      if (p === 'AM' && h === 12) h = 0;
      return `${String(h).padStart(2, '0')}:${mm}`;
    });

    // GMT+1, GMT+01, GMT+01:00, GMT-5, GMT-05:30 -> UTC...
    result = result.replace(/GMT\s*([+-]\d{1,2})(?::?(\d{2}))?/gi, (m, h, mins) => {
      return `UTC${h}${mins ? ':' + mins : ''}`;
    });

    // Само "GMT" -> "UTC"
    result = result.replace(/\bGMT\b/gi, 'UTC');

    return result;
  }

  function processTextNode(textNode) {
    const original = textNode.textContent;
    const converted = convertTo24Hour(original);
    if (original !== converted) {
      textNode.textContent = converted;
    }
  }

  function processElement(el) {
    ['title', 'aria-label', 'data-time'].forEach(attr => {
      if (el.hasAttribute && el.hasAttribute(attr)) {
        const original = el.getAttribute(attr);
        const converted = convertTo24Hour(original);
        if (original !== converted) {
          el.setAttribute(attr, converted);
        }
      }
    });
  }

  function processNode(node) {
    if (!node) return;

    if (node.nodeType === Node.TEXT_NODE) {
      processTextNode(node);
      return;
    }

    if (node.nodeType === Node.ELEMENT_NODE) {
      processElement(node);
      node.childNodes && node.childNodes.forEach(processNode);
    }
  }

  function processExistingContent() {
    if (document.body) processNode(document.body);
  }

  processExistingContent();

  let isProcessing = false;

  const observer = new MutationObserver((mutations) => {
    if (isProcessing) return;
    isProcessing = true;

    try {
      for (const m of mutations) {
        if (m.type === 'childList') {
          m.addedNodes.forEach(processNode);
        } else if (m.type === 'characterData') {
          // Текст промењен у постојећем ноду (ово ти је фалило)
          processTextNode(m.target);
        } else if (m.type === 'attributes') {
          // Атрибут промењен на постојећем елементу
          processElement(m.target);
        }
      }
    } finally {
      // Пусти да се DOM смири па онда дозволи следећу туру
      queueMicrotask(() => { isProcessing = false; });
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: true,
    attributeFilter: ['title', 'aria-label', 'data-time']
  });

  console.log('Tailscale 24-Hour Time Format скрипта је активна');
})();
