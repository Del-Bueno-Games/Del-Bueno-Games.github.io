'use strict';

const select = document.querySelector('select[name="position"]');
const jobs = Array.from(document.querySelectorAll('.job'));

// The visible title is the position name, so what the person reads and what Apply selects cannot differ.
function jobName(job)
{
    return job.querySelector('h4').textContent.trim();
}

const names = jobs.map(function (job)
{
    return jobName(job);
});

// The position blocks are the source of truth: a block missing from the select is added.
for (const name of names)
{
    const known = Array.from(select.options).some(function (option)
    {
        return option.value === name;
    });
    if (!known)
    {
        console.warn('Position "' + name + '" is missing from the form select; added by script.');
        select.add(new Option(name, name), select.options[select.options.length - 1]);
    }
}

// An option with no block is a closed position left behind. Placeholder and general options (data-general) are exempt.
for (const option of select.options)
{
    if (option.value !== '' && !option.hasAttribute('data-general') && !names.includes(option.value))
    {
        console.warn('Select option "' + option.value + '" has no position block.');
    }
}

// A long block has an Apply button at the top and at the bottom; both read the name from their block.
for (const job of jobs)
{
    for (const button of job.querySelectorAll('.btn-apply'))
    {
        button.addEventListener('click', function ()
        {
            select.value = jobName(job);
        });
    }
}
