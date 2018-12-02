/* eslint-disable meteor/template-names,consistent-return */
import {Template} from "meteor/templating";

import {getFieldValue, getCollectionByName} from "../_api";


/* Extend Field: String ID Reference to different Collection */
Template.autoProfileField_string_reference.helpers({
    referenceUrl() {
        const refId = getFieldValue(Template.instance(), this.id || this, this);
        return this.reference.urlPrefix + refId;
    },
    referenceLabel() {
        const ref = this.reference;
        const refId = getFieldValue(Template.instance(), this.id || this, this);
        if (refId && ref && ref.collectionName) {
            const collection = getCollectionByName(ref.collectionName);
            if (collection) {
                const relObj = collection.findOne(refId);
                if (relObj) {
                    return relObj[ref.labelField && (ref.labelField.id || ref.labelField)];
                }
            }
        }
    },
});