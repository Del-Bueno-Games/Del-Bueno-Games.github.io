'use strict';

function bindForm(form)
{
    const button = form.querySelector('.btn-submit');
    const states = form.querySelectorAll('.contact-status [data-state]');

    function showState(name)
    {
        for (const paragraph of states)
        {
            paragraph.hidden = paragraph.dataset.state !== name;
        }
    }

    async function send()
    {
        const data = new URLSearchParams(new FormData(form));
        data.append('format', 'json');
        // No custom headers: keeps it a CORS simple request, so there is no preflight.
        const response = await fetch(form.action,
        {
            method: 'POST',
            body: data,
            signal: AbortSignal.timeout(20000)
        });
        if (!response.ok)
        {
            return false;
        }
        const result = await response.json();
        return result.ok === true;
    }

    form.addEventListener('submit', async function (event)
    {
        event.preventDefault();
        button.disabled = true;
        showState('sending');
        let sent = false;
        try
        {
            sent = await send();
        }
        catch (error)
        {
            sent = false;
        }
        if (sent)
        {
            form.reset();
        }
        showState(sent ? 'sent' : 'error');
        button.disabled = false;
    });
}

for (const form of document.querySelectorAll('.contact-form'))
{
    bindForm(form);
}
