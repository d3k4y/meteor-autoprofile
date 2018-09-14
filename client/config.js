import SimpleSchema from 'simpl-schema';

SimpleSchema.extendOptions({
  autoprofile: Match.Optional(Match.Any)
});

/*
this.profileOptions = {
  collection: Freelancers,
  schema: Schemas.Freelancers,
  rows : [{
    id: "row1",
    cols: [
      {
        id: "col1",
        class: "col-sm-3",
        panels: [
          {
            id: "panel1_1",
            useFirstFieldAsTitle: true,
            fields: [
              {
                id: "fullName",
                highlighted: true,
                subfields: [
                  {name: "salutation"},
                  {name: "title"},
                  {name: "name"},
                  {name: "surename"}
                ]
              },
              {name: "status"},
              {name: "hourlyRange"},
              {name: "freeAgainFrom"},
              {name: "profile"},
              {name: "website"}
            ]
          },
          {
            field: {
              id: "panel1_2",
              name: "acceptableAreas"
            }
          },
          {
            field: {
              name: "tags"
            }
          },
          {
            field: {
              name: "skills"
            }
          }
        ],
      },
      {
        id: "col2",
        class: "col-sm-6",
        panels: [
          {
            id: "panel2_1",
            field: {name: "note"}
          },
          {field: {name: "description"}}
        ],
      },
      {
        id: "col3",
        class: "col-sm-3",
        panels: [
          {
            id: "panel3_1",
            noBorder: true,
            field: {
              name:"picture",
            }
          },
          {
            fields: [
              {name:"createdAt"},
              {name:"username"},
              {name:"updatedAt"},
              {name:"updatedByUsername"}
            ]
          }
        ],
      }
    ]
  }]
};
*/




//somewhere in both (client and  server)
/*
import {SimpleChat} from 'meteor/cesarve:simple-chat/config'
SimpleChat.configure ({
  texts:{
    loadMore: 'Load More',
    placeholder: 'Type message ...',
    button: 'send',
    join: 'Join to',
    left: 'Left the',
    room: 'room at'
  },
  limit: 5,
  beep: false,
  showViewed: true,
  showReceived: true,
  showJoined: true,
  publishChats: function(roomId, limi){ //server
    //here the context is the same for a Publications, that mean you have access to this.userId who are asking for subscribe.
    // for example
    return Meteor.user() ? true : false;
    //return isLoggedAndHasAccessSendMessages(this.userId)
  },
  allow: function(message, roomId, username, avatar, name){
    //here the context is the same for a Methods, thats mean you hace access to this.userId also
    // for example
    return Meteor.user() ? true : false;
    //return isLoggedAndHasAccessSendMessages(this.userId)
  },
  onNewMessage:function(msg){  //both
  },
  onClientReceiveNewMessage: function (doc) {
    if(Meteor.isClient) {
      console.log("newMessage received");
      console.info(doc);
      toastr.success(doc.message, "Neue Chatnachricht von " + doc.username);
      var chatToggle = $("#chatPanelToggle");
      if(!chatToggle.hasClass("fa-angle-down")) {
        chatToggle.addClass("unread-messages");
      }
    }
  },
  onReceiveMessage:function(id, message, room){ //server
  },
  onJoin:function(roomId, username, name,date){  //server
  },
  onLeft:function(roomId, username, name,date) { //server
  }
});
*/