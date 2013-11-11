# jQuery glideToggle

Unobtrusive jQuery plugin that converts a select OR a checkbox into a toggle.

    $('input:checkbox, select').glideToggle();

### Options/Defaults:
    {
        className: '', // in case you need to add a class for styling/scoping
        toggleText: true // set this to false if you want the options to display outside of the toggle
    }

### Notes:

IE < 9 requires a compatible jQuery (< 2) version and a 'quirksmode' DOCTYPE to render inline-block elements properly.
