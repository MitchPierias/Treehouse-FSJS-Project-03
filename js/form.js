// Constants
const EMAIL_PATTERN = /^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)+$/gi;
const JS_PUN_PATTERN = /JS\spuns\sshirt\sonly/gi;
const JS_LOVE_PATTERN = /I\s(&#9829;|♥)\sJS\sshirt\sonly/gi
// Elements
const registerForm = jQuery('form');
const nameField = jQuery('#name');
const emailField = jQuery('#mail');
const roleInput = jQuery('input#role');
const titleField = jQuery('#title');
const paymentField = jQuery('#payment');
const ccNumbElem = jQuery('#cc-num');
const zipElem = jQuery('#zip');
const cvvElem = jQuery('#cvv');
const activityFields = jQuery('fieldset.activities');
const shirtFields = jQuery('fieldset.shirt');
const designSelector = jQuery('#design', shirtFields);
const colorFields = jQuery('#colors-js-puns', shirtFields);
const colorSelector = jQuery('#color', colorFields);
const priceElem = jQuery('<div>Total $0</div>')[0];
// Globals
const fields = {
    products:{},
    schedule:[],
    payment:{}
}

const errors = {};

/**
 * Form ready
 * @desc Handles the register forms ready event
 */
registerForm.ready(event => {
    // Configure initial layout
    nameField.focus();
    roleInput.hide();
    colorFields.hide();
    activityFields.append(priceElem);
    activityFields.each((idx, elem) => elem.name = 'activites');
    paymentField.children().each((idx, elem) => elem.disabled = (elem.value == 'select_method'));
    displayPaymentFieldAtIndex(1);
    // Subscribe event handlers
    nameField.keyup(validate(hasValue('Name is required'), matchPattern(/^[\w\s]+$/gi, 'Name invalid')));
    emailField.keyup(validate(hasValue('Email is required'), matchPattern(EMAIL_PATTERN, 'Email invalid')));
    titleField.change(didChangeTitle);
    designSelector.change(didChangeDesign);
    activityFields.change(didChangeActivity);
    paymentField.change(event => displayPaymentFieldAtIndex(event.target.selectedIndex));
    ccNumbElem.keyup(event => fields.payment.number = event.target.value);
    zipElem.keyup(event => fields.payment.zip = event.target.value);
    cvvElem.keyup(event => fields.payment.cvv = event.target.value);
});

/**
 * Form submit
 * @desc Handles the forms submit event
 * @note `validate()` method needs to be rewritten to be callable without an event and used here.
 */
registerForm.submit(event => {
    event.preventDefault();
    // Validate required fields
    if (!nameField[0].value) appendError(nameField[0], 'Name is required');
    if (!emailField[0].value) appendError(emailField[0], 'Email is required');
    (fields.schedule.length <= 0) ? appendError(activityFields[0], 'Please select at least one activity') : removeError(activityFields.name);
    // Handle credit card payments
    if (paymentField[0].selectedIndex === 1) {
        // A quick solution to validate all credit card field values
        const creditCardElem = jQuery('#credit-card')[0];
        const { number, zip, cvv } = fields.payment;
        creditCardElem.name = 'credit-card';
        if (number && cvv && zip) removeError(creditCardElem.name);
        if (!number || number == '' || number.length < 13 || number.length > 16) appendError(creditCardElem, 'Credit card number invalid or missing');
        if (!zip || zip == '' || typeof(zip) !== 'number' || zip.length > 5) appendError(creditCardElem, 'Credit card zip required');
        if (!cvv || cvv == '' || typeof(cvv) !== 'number' || cvv.length !== 3) appendError(creditCardElem, 'Credit card CVV invalid or missing');
    }
    // Report form submission
    if (Object.values(errors).length <= 0) alert("Success");
});

/***************
 EVENT HANDLERS
****************/

/**
 * Changed Activity
 * @desc Handles changes to activity checkboxes
 * @param {HTMLFormEvent} event - Activity onchange event
 */
function didChangeActivity(event) {
    // Extract activity components
    let total = 0;
    const activityComponents = event.target.nextSibling.data.split(/\s\—\s|\,/gi);
    // Handle user action
    if (activityComponents.length == 2) {
        fields.schedule = (event.target.checked) ? ['all'] : [];
    } else if (event.target.checked) {
        fields.schedule.push(activityComponents[1]);
    } else {
        fields.schedule.splice(fields.schedule.indexOf(activityComponents[1]));
    }
    // Disable invalid activities
    jQuery('input[type=checkbox]',activityFields).each((idx, elem) => {
        const components = elem.nextSibling.data.split(/\s\—\s|\,/gi);
        if (fields.schedule[0] == 'all' && components.length != 2) elem.checked = false;
        if (elem.checked) total += parseInt(components[components.length-1].replace(/[\s\$]/gi,''));
        elem.disabled = (!elem.checked && (fields.schedule[0] == 'all' || fields.schedule.indexOf(components[1]) >= 0));
    });
    // Update price display
    priceElem.innerHTML = `Total $${total}`;
    // Validate schedule
    if (jQuery('input[type=checkbox]:checked',activityFields).length <= 0) {
        appendError(activityFields[0], 'Please select an activity');
    } else {
        removeError(activityFields[0].name);
    }
}

/**
 * Design Changed
 * @desc Handles the design selector's change event
 * @param {HTMLFormEvent} event - Design onchange event
 */
function didChangeDesign(event) {
    fields.products.theme = event.target.value;
    if (event.target.value !== 'Select Theme' && event.target.value !== '') {
        // Filter colors for selected theme
        jQuery.each(colorSelector.children(), (key, elem) => {
            const filterPattern = new RegExp((event.target.value == 'js puns') ? JS_PUN_PATTERN : JS_LOVE_PATTERN);
            (filterPattern.test(elem.text)) ? jQuery(elem).show() : jQuery(elem).hide();
        });
        // Invalidate selected index
        colorSelector[0].selectedIndex = -1;
        // Show colors
        colorFields.show();
    } else {
        // Hide colors
        colorFields.hide();
    }
}

/**
 * Title Changed
 * @desc Handles the job titles selector change event
 * @param {HTMLFormEvent} event - Title onchange event
 */
function didChangeTitle(event) {
    // Handle the job title selection
    if (event.target.value === 'other') {
        // Show the role input
        roleInput.show();
        roleInput.focus();
    } else {
        // Hide the role input
        roleInput.hide();
    }
}

/**
 * Payment Method
 * @desc Displays the payment form for the selected payment method
 * @param {Number} index - Payment method index
 */
function displayPaymentFieldAtIndex(index) {
    // Force-ensure selected index is set
    if (paymentField[0].selectedIndex != index) paymentField[0].selectedIndex = index;
    fields.payment.type = paymentField[0][paymentField[0].selectedIndex].value;
    // Manage payment field visibility
    jQuery(paymentField[0]).parent().children('div').each((idx, elem) => {
        (idx == paymentField[0].selectedIndex-1) ? jQuery(elem).show() : jQuery(elem).hide();
    });
}

/***********
 VALIDATORS
************/

/**
 * Connect Validators
 * @desc Connector function for event validators
 * @returns Event handler
 */
function validate() {
    const handlers = Array.from(arguments);
    return function(event) {
        removeError(event.target.name);
        handlers.forEach(filter => filter(event, err => {
            if ('string' !== typeof err) return;
            appendError(event.target, err);
        }));
    }
}

/**
 * Has Value Validator
 * @desc Constructs an event handler which validates the target element value is set.
 * @param {String} message - (optional) Optional no value error message
 * @returns Event validator
 */
function hasValue(message) {
    if ('string' !== typeof message || message == '') message = 'Field required';
    return function({ target }, next) {
        (target.value === '') ? next(message) : next(false);
    }
}

/**
 * Match Pattern Validator
 * @desc Constructs and event handler to compare the target elements value against the provided pattern.
 * @param {RegExp} pattern - Regular Expression to match
 * @param {String} message - (optional) Optional no match error message
 * @returns Event validator
 */
function matchPattern(pattern, message) {
    if ('string' !== typeof message || message == '') message = 'Invalid value';
    return function({ target }, next) {
        const regex = new RegExp(pattern);
        (target.value !== '' && !regex.test(target.value)) ? next(message) : next(false);
    }
}

/**
 * Append Error
 * @desc Creates and appends an error element with message to the provided element
 * @param {HTMLElement} elem - Element to append error too
 * @param {String} message - The message to display
 */
function appendError(elem, message) {
    if ('string' === typeof errors[elem.name]) return;
    jQuery(elem).after(`<div class="error" for="${elem.name}" style="text-align:right;font-size:0.9em;">${message}</div>`);
    errors[elem.name] = message;
}

/**
 * Remove Error
 * @desc Removes the error element for the provided reference name.
 * @param {String} name - Error reference name
 */
function removeError(name) {
    if (!errors[name]) return;
    jQuery(`div.error[for='${name}']`).remove();
    delete errors[name];
}