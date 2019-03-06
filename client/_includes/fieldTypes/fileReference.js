/* eslint-disable meteor/template-names,consistent-return */
import {Template} from "meteor/templating";
import {_} from "meteor/erasaur:meteor-lodash";
import {SimpleSchemaFunctions} from "meteor/d3k4y:meteor-simple-schema-functions";

import {getFieldValue, getOptions, getCollectionByName} from "../_api";


Template.autoProfileField_fileReference.helpers({
    referencedObject() {
        const instance = Template.instance();
        const fieldValue = getFieldValue(instance, this.id, this);
        const profileOptions = getOptions(instance);
        const fieldSchema = SimpleSchemaFunctions.getFieldSchema(profileOptions.collection, this.id);
        const afFieldInput = _.get(fieldSchema, 'autoform.afFieldInput');
        if (afFieldInput) {
            const collection = getCollectionByName(afFieldInput.collection);
            if (collection) {
                return collection.findOne(fieldValue);
            }
        }
    }
});
