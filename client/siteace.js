Websites = new Mongo.Collection("websites");

if (Meteor.isClient) {
	Accounts.ui.config({
		passwordSignupFields: "USERNAME_AND_EMAIL"
	});

	/////
	// template helpers
	/////
	Template.body.helpers({
		isLoggedIn: function(){
			//console.log(Meteor.user());
			if(Meteor.user()) {
				return true;
			} else {
				return false;
			}
		}
	});

	Template.registerHelper("prettifyDate", function(timestamp) {
			var options = {
			    weekday: "long", year: "numeric", month: "short",
			    day: "numeric", hour: "2-digit", minute: "2-digit"
			};
			return new Date(timestamp).toLocaleTimeString("en-us", options);
	});

	// helper function that returns all available websites
	Template.website_list.helpers({
		websites:function(){
			return Websites.find({},{sort:{upVotes: -1}});
		}
	});


	/////
	// template events
	/////

	Template.website_item.helpers({
		isLoggedIn: function(){
			//console.log(Meteor.user());
			if(Meteor.user()) {
				return true;
			} else {
				return false;
			}
		},
		getUser: function(user_id){
			var user = Meteor.users.findOne({_id:user_id});
			if (user){
				return user.username;
			}
			else {
				return "unknown";
			}
		}
	});

	Template.website_item.events({
		"click .js-upvote":function(event){
			// example of how you can access the id for the website in the database
			// (this is the data context for the template)
			var website_id = this._id;
			//console.log("Up voting website with id "+website_id);
			// put the code in here to add a vote to a website!

			var website = Websites.findOne({_id:website_id});
			var upVotes = 0;
			if(website.upVotes != undefined)
				upVotes = website.upVotes;

			Websites.update({_id:website_id},
										{$set: {upVotes: upVotes + 1}});

			return false;// prevent the button from reloading the page
		},
		"click .js-downvote":function(event){

			// example of how you can access the id for the website in the database
			// (this is the data context for the template)
			var website_id = this._id;
			//console.log("Down voting website with id "+website_id);

			// put the code in here to remove a vote from a website!

			var website = Websites.findOne({_id:website_id});
			var downVotes = 0;
			if(website.downVotes != undefined)
				downVotes = website.downVotes;

			Websites.update({_id:website_id},
										{$set: {downVotes:downVotes+1}});

			return false;// prevent the button from reloading the page
		}
	});

	Template.website_form.helpers({
		isLoggedIn: function(){
			//console.log(Meteor.user());
			if(Meteor.user()) {
				return true;
			} else {
				return false;
			}
		}
	});

	Template.website_form.events({
		"click .js-toggle-website-form":function(event){
			$("#website_form").toggle('slow');
		},
		"submit .js-save-website-form":function(event){

			// here is an example of how to get the url out of the form:
			var target = event.target;
			var url = target.url.value;
			var title = target.title.value;
			var description = target.description.value
			//console.log("The url they entered is: "+url);

			HTTP.call("GET", url,
	      function (error, result) {
	        if (!error) {
	          console.log(result);
	        }
	      });

			if(url.trim() === "" ||
				title.trim() === "") {
					Session.set("message","Please input URL and Title.");
					$("#msg_dialog").modal("show");
			} else {
					Websites.insert({
						title: title,
						url: url,
						description: description,
						upVotes: 0,
						downVotes: 0,
						createdOn:new Date(),
            createdBy:Meteor.user()._id
					});

					$(target.url).val("");
					$(target.title).val("");
					$(target.description).val("");

					$("#website_form").toggle('slow');

					Session.set("message","Site added.");
					$("#msg_dialog").modal("show");
			}
			return false;// stop the form submit from reloading the page

		}
	});

	Template.comment_form.helpers({
		isLoggedIn: function(){
			//console.log(Meteor.user());
			if(Meteor.user()) {
				return true;
			} else {
				return false;
			}
		}
	});

	Template.comment_form.events({
		"submit .js-comment-form":function(event){
			var website_id = this.websiteid;
			var target = event.target;
			var comment = target.comment.value;
			$(event.target.comment).val("");


			Websites.update({_id:website_id},
											{$addToSet: {
												"comments":
												{
													comment: comment,
													createdOn:new Date(),
					            		createdBy:Meteor.user()._id
												}
											}}
			);

			return false;// stop the form submit from reloading the page

		}
	});

	Template.msg_dialog.helpers({
			getMessage: function() {
				return Session.get("message");
			}
	});

}
