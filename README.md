# Meteor Autoprofile


## Disclaimer

!WIP, the current version is 0.1.0!

## Features

- Generate profile pages based on SimplSchema model definitions
- Configure the generated profile via a simple configuration object


## Installation

    $ meteor add d3k4y:meteor-autoprofile
    
There are some optional dependencies that you could install to extend the functionality (at least one of them is required to enable editing):

- aldeed:autoform
- d3k4y:autoform-modals
- babrahams:editable-text


## Usage

Call the autoProfile template in one of your own templates:

    $ {{> autoProfile options=getProfileOptions myContext=getContext}}


Create a 'profileOptions' helper to configure your profile:

```js
Template.myTemplate.helpers({
    getProfileOptions() {
        return {
            collection: Meteor.users,
            collectionName: 'Meteor.users',
            method: 'myServerMethodToUpdateUserProfile',
            rows: [{
                cols: [
                    {
                        class: 'col-sm-6',
                        panels: [
                            {
                                highlighted: true,
                                view: 'list',
                                titleField: {
                                    group: [
                                        {id: 'profile.salutation'},
                                        {id: 'profile.name'},
                                        {id: 'profile.surename'}
                                    ]
                                },
                                fields: [
                                    {id: 'username', editable: false},
                                    {id: 'createdAt', editable: false}
                                ]
                            }
                        ]
                    }, {
                        class: 'col-sm-3',
                        panels: [
                            {
                                icon: 'link',
                                view: 'list',
                                field: {
                                    id: 'profile.adresses',
                                    titleField: {id: 'profile.adresses.$.kind'},
                                    subfields: [
                                        {id: 'profile.adresses.$.street'},
                                        {id: 'profile.adresses.$.city'},
                                        {id: 'profile.adresses.$.plz'},
                                        {id: 'profile.adresses.$.country'}
                                    ]
                                }
                            },
        
                        ]
                    }, {
                        class: 'col-sm-3',
                        panels: [
                            {
                                icon: 'link',
                                view: 'list',
                                listContent: true,
                                field: {
                                    id: 'emails',
                                    editable: false,
                                    render: 'inplace', // default: 'sublist'
                                    titleField: {id: 'emails.$.address'},
                                    subfields: [
                                        {id: 'emails.$.verified'}
                                    ]
                                }
                            }
                        ]
                    }
                ]
            }]
        };
    }
});
```

A SimplSchema definition for the related collection is required, e.g.:

```js
Meteor.users.attachSchema(new SimpleSchema({
    _id: {
      type: String,
      max: 20,
      optional: true,
      autoform: {
          afFieldInput: {
              type: 'hidden',
          },
          afFormGroup: {
              label: false
          }
      }
    },
    username: {
      type: String,
      label: "Benutzername",
      optional: true
    },
    emails: {
      type: Array,
      label: "E-Mail Adressen",
      optional: true
    },
    "emails.$": {
      label: "E-Mail Adresse",
      type: Object,
      optional: true
    },
    "emails.$.address": {
      label: "E-Mail Adresse",
      type: String,
      regEx: SimpleSchema.RegEx.Email,
      optional: true
    },
    "emails.$.verified": {
      label: "E-Mail Adresse bestätigt",
      type: Boolean
    },
    createdAt: {
      type: Date,
      denyUpdate: true,
      label: "Erstellt am",
      autoValue() {
          if (this.isInsert) {
              return new Date();
          } else if (this.isUpsert) {
              return {$setOnInsert: new Date()};
          } else if (this.isUpdate) {
          } else {
              this.unset();
          }
          return undefined;
      },
      autoform: {
          omit: true
      }
    },
    profile: {
      type: new SimpleSchema({
          salutation: {
            type: String,
            label: "Salutation",
            allowedValues: ['Herr', 'Frau'],
            optional: true,
            max: 70
          },
          name: {
            type: String,
            label: "Name",
            optional: true,
            max: 70
          },
          surename: {
            type: String,
            label: "Surename",
            optional: true,
            max: 70
          },
          adresses: {
            type: Array,
            label: "Adressen",
            optional: true
          },
          "adresses.$": {
            type: Object,
            label: "Adress"
          },
          "adresses.$.street": {
            type: String,
            label: "Street",
            min: 0,
            max: 70
          },
          "adresses.$.plz": {
            type: String,
            label: "Postal Code",
            max: 20
          },
          "adresses.$.city": {
            type: String,
            label: "City",
            max: 70
          },
          "adresses.$.state": {
            type: String,
            label: "State",
            max: 70
          },
          "adresses.$.country": {
            type: String,
            label: "Country"
          },
          "adresses.$.kind": {
            type: String,
            label: "Adress Type",
            allowedValues: ['business', 'private', 'both'],
            autoform: {
                options: [
                    {label: "Business", value: "business"},
                    {label: "Private", value: "private"},
                    {label: "Both", value: "both"}
                ]
            }
          },            
      }),
      label: "User Profile",
      optional: true
    },
    services: {
      type: Object,
      optional: true,
      blackbox: true,
      autoform: {
          omit: true
      }
    },
    roles: {
      type: Object,
      blackbox: true,
      optional: true
    },
    heartbeat: {
      type: Date,
      optional: true,
      autoform: {
          omit: true
      }
    }
}));
```
