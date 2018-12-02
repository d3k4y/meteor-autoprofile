/* eslint-disable meteor/template-names */
import {Template} from "meteor/templating";
import {SimpleSchemaFunctions} from "meteor/corefi:meteor-simple-schema-functions";

import {getFieldValue, getOptions} from "../_api";


Template.autoProfileField_fileCheck.helpers({
    getLink() {
        if (typeof this.link === 'function') {
            const instance = Template.instance();
            const fieldValue = getFieldValue(instance, this.id, this);
            const fieldSchema = SimpleSchemaFunctions.getFieldSchema(getOptions(instance).collection, this.id);
            return this.link.call(this, fieldValue, fieldSchema);
        }
        return null;
    }
});