/* eslint-disable meteor/template-names,consistent-return */
import {Template} from "meteor/templating";
import {SimpleSchemaFunctions} from "meteor/corefi:meteor-simple-schema-functions";

import {getOptions} from "../_api";


Template.autoProfileField_fileCheckArray.helpers({
    getLinkArray(value) {
        if (typeof this.link === 'function') {
            const instance = Template.instance();
            const fieldSchema = SimpleSchemaFunctions.getFieldSchema(getOptions(instance).collection, this.id);
            return this.link.call(this, value, fieldSchema);
        }
        return null;
    },

    getFilename(value) {
        if (value) {
            const collection = window.Files;
            if (collection) {
                try {
                    return collection.findOne({_id: value}).name;
                } catch (error) {
                    // error
                }
            }
        }
    },
    getClass(value) {
        return this.class;
    }
});
