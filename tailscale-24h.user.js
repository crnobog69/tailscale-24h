// ==UserScript==
// @name         Tailscale 24-Hour Time Format
// @namespace    Violentmonkey Scripts
// @version      1.1
// @description  Конвертује AM/PM формат у 24-часовни формат и GMT у UTC на Tailscale сајту
// @author       crnobog
// @match        https://login.tailscale.com/*
// @match        https://*.tailscale.com/*
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    // Функција за конверзију AM/PM у 24-часовни формат
    function convertTo24Hour(timeString) {
        // Проналажење времена у формату као што је "3:45 PM" или "11:30 AM"
        const timeRegex = /(\d{1,2}):(\d{2})\s*(AM|PM)/gi;
        
        let result = timeString.replace(timeRegex, function(match, hours, minutes, period) {
            let hour = parseInt(hours, 10);
            
            if (period.toUpperCase() === 'PM' && hour !== 12) {
                hour += 12;
            } else if (period.toUpperCase() === 'AM' && hour === 12) {
                hour = 0;
            }
            
            return `${hour.toString().padStart(2, '0')}:${minutes}`;
        });
        
        // Конверзија GMT у UTC формат (GMT+1 -> UTC+1, GMT-5 -> UTC-5)
        result = result.replace(/GMT([+-]\d{1,2})/gi, 'UTC$1');
        
        return result;
    }

    // Функција за обраду свих текстуалних нодова
    function processNode(node) {
        if (node.nodeType === Node.TEXT_NODE) {
            const originalText = node.textContent;
            const convertedText = convertTo24Hour(originalText);
            
            if (originalText !== convertedText) {
                node.textContent = convertedText;
            }
        } else if (node.nodeType === Node.ELEMENT_NODE) {
            // Обрада атрибута који могу садржати време
            ['title', 'aria-label', 'data-time'].forEach(attr => {
                if (node.hasAttribute(attr)) {
                    const originalValue = node.getAttribute(attr);
                    const convertedValue = convertTo24Hour(originalValue);
                    if (originalValue !== convertedValue) {
                        node.setAttribute(attr, convertedValue);
                    }
                }
            });
            
            // Обрада деце нода
            node.childNodes.forEach(processNode);
        }
    }

    // Обрада постојећег садржаја
    function processExistingContent() {
        processNode(document.body);
    }

    // Иницијална обрада
    processExistingContent();

    // MutationObserver за праћење промена у DOM-у
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            mutation.addedNodes.forEach(function(node) {
                processNode(node);
            });
        });
    });

    // Покретање посматрача
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    console.log('Tailscale 24-Hour Time Format скрипта је активана');
})();
