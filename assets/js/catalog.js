'use strict';

const catalog = document.querySelector('.catalog');

function scrollByCard(direction)
{
    const card = catalog.querySelector('li');
    const gap = parseFloat(getComputedStyle(catalog).columnGap) || 0;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    catalog.scrollBy(
    {
        left: direction * (card.offsetWidth + gap),
        behavior: reduced ? 'auto' : 'smooth'
    });
}

function createArrow(direction)
{
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'catalog-arrow catalog-arrow-' + (direction > 0 ? 'next' : 'prev');
    button.setAttribute('aria-label', direction > 0 ? 'Next project' : 'Previous project');
    button.textContent = direction > 0 ? '›' : '‹';
    button.addEventListener('click', function ()
    {
        scrollByCard(direction);
    });
    return button;
}

if (catalog)
{
    const prev = createArrow(-1);
    const next = createArrow(1);

    // Disable an arrow when the row cannot move that way, so it never looks like a dead click.
    function updateArrows()
    {
        const end = catalog.scrollWidth - catalog.clientWidth - 1;
        prev.disabled = catalog.scrollLeft <= 0;
        next.disabled = catalog.scrollLeft >= end;
    }

    catalog.parentElement.append(prev, next);
    catalog.addEventListener('scroll', updateArrows, { passive: true });
    window.addEventListener('resize', updateArrows);
    updateArrows();
}
