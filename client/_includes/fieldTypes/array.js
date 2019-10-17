/* eslint-disable meteor/template-names */
import {Template} from "meteor/templating";
import {_} from "meteor/erasaur:meteor-lodash";

import {getTooltipDirection, getTooltipClasses, getTooltipValue, handleMouseoutEvent} from "../_api";


/* Extend Field: AutoProfile array of objects Field */
Template.autoProfileField_array.helpers({
    tooltipValue() {
        return getTooltipValue(Template.instance(), this.toString());
    },
    tooltipDirection() {
        return getTooltipDirection(Template.instance());
    },
    tooltipClasses() {
        return getTooltipClasses(Template.instance());
    }
});


Template.autoProfileField_array.events({
    'mouseout'(event, template, doc) {
        handleMouseoutEvent(event);
    }
});
