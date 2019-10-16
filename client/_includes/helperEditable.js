/* eslint-disable meteor/template-names */
import {Template} from "meteor/templating";


Template.autoProfileFieldHelper_editable.helpers({
    isEditable() {
        if (this.fieldOptions && this.fieldOptions.value) { return false; }
        const fieldOptions = Template.instance().data.fieldOptions;
        return fieldOptions && (typeof fieldOptions.editable === 'undefined' || fieldOptions.editable);
    },
});