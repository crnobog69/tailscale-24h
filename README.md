# Tailscale 24-Hour Clock

Userscript који конвертује 12-часовни формат (AM/PM) у 24-часовни формат на Tailscale сајту.

## Инсталација

1. Инсталирајте browser екстензију за userscripts:
   - Chrome/Edge: [Violentmonkey](https://violentmonkey.github.io/) или [Tampermonkey](https://www.tampermonkey.net/)
   - Firefox: [Violentmonkey](https://violentmonkey.github.io/) или Greasemonkey

2. Кликните на `tailscale-24h.user.js` фајл
   - Ако имате инсталирану екстензију, аутоматски ће понудити инсталацију
   - Или отворите Tampermonkey Dashboard → Create new script → копирајте садржај фајла

3. Сачувајте скрипту

## Шта ради

- Конвертује `3:45 PM` → `15:45`
- Конвертује `11:30 AM` → `11:30`
- Конвертује `GMT+1` → `UTC+1`
- Аутоматски обрађује динамички учитан садржај

## Коришћење

Отворите Tailscale admin интерфејс. Сва времена ће аутоматски бити приказана у 24-часовном формату.
