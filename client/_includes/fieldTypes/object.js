/* eslint-disable meteor/template-names */
import {Template} from "meteor/templating";

import {getFieldValue} from "../_api";


Template.autoProfileField_object.helpers({
    fieldValueAsJSON() {
        return JSON.stringify(getFieldValue(Template.instance(), this.id, this));
    }
});