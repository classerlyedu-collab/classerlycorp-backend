const mongoose=require("mongoose");
const {Schema}=require('mongoose');

const EventSchema=new Schema({
    name:{
        type:String
    }
})

const EventModel= mongoose.model("upcomingEvents",EventSchema);
module.exports=EventModel;
