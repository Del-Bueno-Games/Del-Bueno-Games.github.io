const MAX_NAME = 100;
const MAX_COMPANY = 100;
const MAX_POSITION = 100;
const MAX_EMAIL = 254;
const MAX_LINK = 500;
const MAX_MESSAGE = 4000;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const LINK_PATTERN = /^https?:\/\/\S+\.\S+$/;
const REASONS = ['Press', 'Publishing', 'Collaboration', 'Other'];

// Workspace accounts can send to 1,500 recipients per day; 20 per hour caps an attack
// at 480 per day, so the studio's own quota is never exhausted. The cap is shared by all forms.
const MAX_SENDS_PER_WINDOW = 20;
const WINDOW_MINUTES = 60;

const SPREADSHEET_NAME = 'Website forms';
const SHEETS = {
    contact: { tab: 'Contact', header: ['Date', 'Name', 'Company', 'Email', 'Reason', 'Message'] },
    newsletter: { tab: 'Newsletter', header: ['Date', 'Email'] },
    careers: { tab: 'Careers', header: ['Date', 'Name', 'Email', 'Position', 'Link', 'Message'] }
};

function doGet()
{
    return ContentService.createTextOutput('The website forms are running (v2).');
}

// Run once from the editor: creates the spreadsheet if needed and asks for its permissions.
function setup()
{
    const url = openSpreadsheet().getUrl();
    Logger.log(url);
    return url;
}

function doPost(e)
{
    const params = (e && e.parameter) ? e.parameter : {};
    const field = function (key)
    {
        return (typeof params[key] === 'string') ? params[key].trim() : '';
    };
    const asJson = field('format') === 'json';
    // A post without "form" comes from the v1 page, which only had name, email and message.
    const legacy = field('form') === '';
    const form = legacy ? 'contact' : field('form');

    // Answer success so a bot never learns it was caught; checked before the rate cap so bots use no slots.
    if (field('website') !== '')
    {
        return respond(asJson, true, '', form);
    }

    const record = parseForm(form, legacy, field);
    if (record === null)
    {
        return respond(asJson, false, 'invalid', form);
    }

    const props = PropertiesService.getScriptProperties();
    let to = '';
    if (form !== 'newsletter')
    {
        to = props.getProperty(form === 'contact' ? 'CONTACT_TO' : 'CAREERS_TO');
        if (!to)
        {
            return respond(asJson, false, 'config', form);
        }
    }

    const lock = LockService.getScriptLock();
    if (!lock.tryLock(10000))
    {
        return respond(asJson, false, 'busy', form);
    }
    try
    {
        const now = Date.now();
        const start = Number(props.getProperty('RATE_WINDOW_START')) || 0;
        let count = Number(props.getProperty('RATE_WINDOW_COUNT')) || 0;
        let windowStart = start;
        if (now - start >= WINDOW_MINUTES * 60000)
        {
            windowStart = now;
            count = 0;
        }
        if (count >= MAX_SENDS_PER_WINDOW)
        {
            return respond(asJson, false, 'busy', form);
        }
        props.setProperties(
        {
            RATE_WINDOW_START: String(windowStart),
            RATE_WINDOW_COUNT: String(count + 1)
        });

        try
        {
            if (!saveRecord(form, record))
            {
                // A repeated newsletter address answers like a new one and sends nothing.
                return respond(asJson, true, '', form);
            }
        }
        catch (error)
        {
            return respond(asJson, false, 'failed', form);
        }
    }
    finally
    {
        lock.releaseLock();
    }

    if (form === 'newsletter')
    {
        return respond(asJson, true, '', form);
    }

    try
    {
        MailApp.sendEmail(buildMail(form, record, to));
    }
    catch (error)
    {
        return respond(asJson, false, 'failed', form);
    }
    return respond(asJson, true, '', form);
}

// Returns the validated fields of a form, or null when anything is wrong.
function parseForm(form, legacy, field)
{
    const within = function (value, max)
    {
        return value.length <= max;
    };
    const validEmail = function (value)
    {
        return value !== '' && within(value, MAX_EMAIL) && EMAIL_PATTERN.test(value);
    };

    if (form === 'contact')
    {
        // The v1 page never sent a reason; the v2 form always does.
        const reason = legacy ? 'Other' : field('reason');
        const record = {
            name: field('name'), company: field('company'), email: field('email'),
            reason: reason, message: field('message')
        };
        const ok = record.name !== '' && within(record.name, MAX_NAME) &&
            within(record.company, MAX_COMPANY) && validEmail(record.email) &&
            REASONS.indexOf(record.reason) >= 0 &&
            record.message !== '' && within(record.message, MAX_MESSAGE);
        return ok ? record : null;
    }
    if (form === 'newsletter')
    {
        const record = { email: field('email') };
        return (validEmail(record.email) && field('consent') === 'yes') ? record : null;
    }
    if (form === 'careers')
    {
        const record = {
            name: field('name'), email: field('email'), position: field('position'),
            link: field('link'), message: field('message')
        };
        const ok = record.name !== '' && within(record.name, MAX_NAME) && validEmail(record.email) &&
            record.position !== '' && within(record.position, MAX_POSITION) &&
            record.link !== '' && within(record.link, MAX_LINK) && LINK_PATTERN.test(record.link) &&
            within(record.message, MAX_MESSAGE) && field('consent') === 'yes';
        return ok ? record : null;
    }
    return null;
}

function openSpreadsheet()
{
    const props = PropertiesService.getScriptProperties();
    const id = props.getProperty('SHEET_ID');
    if (id)
    {
        return SpreadsheetApp.openById(id);
    }
    const created = SpreadsheetApp.create(SPREADSHEET_NAME);
    props.setProperty('SHEET_ID', created.getId());
    return created;
}

function getTab(spreadsheet, form)
{
    const definition = SHEETS[form];
    const existing = spreadsheet.getSheetByName(definition.tab);
    if (existing)
    {
        return existing;
    }
    const sheets = spreadsheet.getSheets();
    let sheet;
    if (sheets.length === 1 && sheets[0].getLastRow() === 0)
    {
        // The new spreadsheet's default sheet becomes the first tab instead of staying empty.
        sheet = sheets[0];
        sheet.setName(definition.tab);
    }
    else
    {
        sheet = spreadsheet.insertSheet(definition.tab);
    }
    sheet.appendRow(definition.header);
    return sheet;
}

// A person opens the spreadsheet, so text that starts like a formula is stored as plain text.
function safeCell(value)
{
    if (typeof value === 'string' && /^[=+\-@\t\r]/.test(value))
    {
        return '\'' + value;
    }
    return value;
}

function normalizeEmail(value)
{
    return String(value).replace(/^'/, '').replace(/\s+/g, '').toLowerCase();
}

// Returns false when nothing was added (repeated newsletter address).
function saveRecord(form, record)
{
    const sheet = getTab(openSpreadsheet(), form);
    const date = new Date(Date.now());
    let row;
    if (form === 'newsletter')
    {
        const last = sheet.getLastRow();
        if (last > 1)
        {
            const known = sheet.getRange(2, 2, last - 1, 1).getValues();
            const wanted = normalizeEmail(record.email);
            for (let i = 0; i < known.length; i++)
            {
                if (normalizeEmail(known[i][0]) === wanted)
                {
                    return false;
                }
            }
        }
        row = [date, record.email];
    }
    else if (form === 'contact')
    {
        row = [date, record.name, record.company, record.email, record.reason, record.message];
    }
    else
    {
        row = [date, record.name, record.email, record.position, record.link, record.message];
    }
    sheet.appendRow(row.map(safeCell));
    return true;
}

function buildMail(form, record, to)
{
    const oneLine = function (value)
    {
        return value.replace(/[\r\n]+/g, ' ');
    };
    if (form === 'contact')
    {
        return {
            to: to,
            subject: '[Web] ' + record.reason + ': message from ' + oneLine(record.name),
            body: 'Name: ' + record.name + '\nCompany: ' + record.company + '\nEmail: ' + record.email +
                '\nReason: ' + record.reason + '\n\n' + record.message +
                '\n\nSent from the website contact form.',
            replyTo: record.email,
            name: 'Website contact form'
        };
    }
    return {
        to: to,
        subject: '[Web] Application: ' + oneLine(record.position) + ' from ' + oneLine(record.name),
        body: 'Name: ' + record.name + '\nEmail: ' + record.email + '\nPosition: ' + record.position +
            '\nLink: ' + record.link + '\n\n' + record.message +
            '\n\nSent from the website careers form.',
        replyTo: record.email,
        name: 'Website careers form'
    };
}

function respond(asJson, ok, code, form)
{
    if (asJson)
    {
        const body = ok ? { ok: true } : { ok: false, error: code };
        return ContentService.createTextOutput(JSON.stringify(body))
            .setMimeType(ContentService.MimeType.JSON);
    }
    const thanks = {
        contact: 'Thanks! Your message was sent. We\'ll get back to you soon.',
        newsletter: 'Thanks! You are on the list.',
        careers: 'Thanks! Your application was sent. We\'ll get back to you soon.'
    };
    const text = ok
        ? (thanks[form] || thanks.contact) + ' You can close this tab or go back to the previous page.'
        : 'Your submission could not be sent. Please go back to the previous page and try again, or write to us by email.';
    return ContentService.createTextOutput(text);
}
