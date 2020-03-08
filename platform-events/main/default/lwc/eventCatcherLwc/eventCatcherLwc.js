import { LightningElement, wire } from 'lwc';
import { getRecord } from 'lightning/uiRecordApi';
import { subscribe, onError } from 'lightning/empApi';
import USER_ID from '@salesforce/user/Id';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { CurrentPageReference, NavigationMixin } from "lightning/navigation";

export default class EventCatcherLWC extends LightningElement {

    channelName = '/event/AsynchronousProcess__e';
    subscription = {};
    recordId;

    @wire(getRecord, { recordId: '$recordId', layoutTypes: 'Full' })
    record;

    @wire(CurrentPageReference)
    currentPageReference() {
        if(this.recordId) {
            var recordId = this.recordId;
            this.recordId = undefined;
            this.record = undefined;
            this.recordId = recordId;
            console.log('CURRENT PAGE REFERENCE REFRESH');
            refreshApex(this.record);
        }
    }

    refreshData() {
        if(this.recordId) {
            var recordId = this.recordId;
            this.recordId = undefined;
            this.record = undefined;
            this.recordId = recordId;
            console.log('BUTTON REFRESH');
            refreshApex(this.record);
        }
    }

    // Called when the component is initialized.
    // Subscribes to the channel and displays a toast message.
    // Specifies an error handler function for empApi.
    connectedCallback() {
        // Callback function to be passed in the subscribe call after an event is received.
        // This callback prints the event payload to the console.
        // A helper method displays the message in the console app.
        var self = this;
        const messageCallback = function(response) {
            self.onReceiveEvent(response);
        };
        // Subscribe to the channel and save the returned subscription object.
        subscribe(this.channelName, -1, messageCallback).then(response => {
            this.subscription = response;
        });
    }

    // Client-side function that displays the platform event message
    // in the console app and displays a toast if not muted.
    onReceiveEvent(response) {
        if (response.data.payload.UserToNotify__c == USER_ID) {
            // Extract notification from platform event.
            const newNotification = {
                recordId: response.data.payload.RecordId__c,
                recordName: response.data.payload.RecordName__c,
                message: response.data.payload.Message__c
            };
            // Display notification in a toast.
            this.displayToast("sticky", "error", newNotification.recordId, newNotification.recordName, newNotification.message);
            // Get record's data.
            this.recordId = undefined;
            this.record = undefined;
            this.recordId = newNotification.recordId;
            console.log('ON RECEIVE EVENT REFRESH');
            refreshApex(this.record);
        }
    }

    // Displays the given toast message.
    displayToast(mode, variant, recordId, recordName, message) {
        const toastEvent = new ShowToastEvent({
            "mode": mode,
            "variant": variant,
            "message": message,
            "messageData": [
                {
                    url: "/lightning/r/Contact/" + recordId + "/view",
                    label: recordName,
                }
            ]
        });
        this.dispatchEvent(toastEvent);
    }

    // Define an error handler function that prints the error to the console.
    registerErrorListener() {
        onError(error => {
            console.log(JSON.stringify(error));
        });
    }

}