// eslint-disable-next-line import/no-unresolved
import {AutoForm} from 'meteor/aldeed:autoform';
import {_} from "meteor/erasaur:meteor-lodash";
import toastr from 'toastr';


/**
 * DOCUMENTATION:
 *      - https://github.com/aldeed/meteor-autoform#callbackshooks
 */
AutoForm.addHooks(['editUserProfileForm'], {
    before: {
        method: function (doc) {
            this.result({
                _id: this.currentDoc._id,
                profile: _.merge({}, this.collection.findOne(this.currentDoc._id).profile || {}, doc.profile)
            });
        },
    },
    onSuccess(formType, result) { toastr.success('Das Benutzerprofil wurde erfolgreich aktualisiert'); },
    onError(formType, error) { toastr.error(`Beim Erstellen des Benutzerprofils ist ein Fehler aufgetreten: ${error}`); }
});