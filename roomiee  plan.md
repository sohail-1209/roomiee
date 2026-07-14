# Roomiee

# **Roomy.in \- Complete Product Plan**

## **Goal**

Become India's easiest platform to:

* 🏠 Find rental houses  
* 👥 Find roommates  
* 🏡 List houses for rent  
* ⭐ Build trust between owners and tenants  
* 💬 Communicate safely  
* 📍 Explore nearby facilities  
* 🤖 Search naturally using AI

# **Authentication**

JWT Authentication

↓

Access Token

↓

Refresh Token

↓

Protected APIs

Optional

* Google Login  
* Phone OTP

# 

# roles

# **User Roles**

## **1\. Guest**

Can

* Browse listings  
* Browse room sharing  
* Use filters  
* View photos  
* View map  
* Read reviews

Cannot

* Chat  
* Save listing  
* Send requests  
* Contact owners

---

## **2\. Tenant**

Can

* Login  
* Save listings  
* Send rental request  
* Send roommate request  
* Chat  
* Report listings  
* Rate owner  
* Receive ratings  
* View accepted contact number

---

## **3\. Owner**

Can

* Upload rental listing  
* Upload room-sharing listing  
* Accept/Reject requests  
* Chat  
* View ratings  
* Rate tenants  
* Manage listings

---

## **4\. Admin**

Can

* Remove fake listings  
* Ban users  
* Moderate reports  
* Verify listings  
* View analytics  
* Handle abuse

---

# pages

# **Home Screen**

Search

Popular Areas

House Rentals

Room Sharing

Recently Added

Nearby Properties

Recommended

Featured Listings  
---

# **Search**

Search by

* Location  
* Budget  
* Gender  
* House Type  
* Room Type  
* Amenities  
* Furnished  
* Nearby College  
* Nearby Metro  
* Nearby Hospital  
* Pet Friendly

---

# **AI Search**

Search box

Example

Need a room under ₹6000  
near Mehdipatnam

Female only

AI converts

↓

Location \= Mehdipatnam

Budget \<= 6000

Gender \= Female

Another example

Need house near Hitech City  
with parking

AI converts into SQL filters automatically.

---

# **House Listing**

Contains

Large Gallery

Rent

Deposit

Maintenance

Availability

Bedrooms

Bathrooms

Balcony

Parking

Area

Description

Amenities

Rules

Owner Rating

Photos

Map

Nearby Places

Reviews

Request Button

Save Button

Share Button

Report Button

---

# **Nearby Places**

Automatically display

Hospitals

Schools

Colleges

Metro Stations

Bus Stops

Gyms

Restaurants

Medical Shops

Grocery Stores

ATM

Petrol Pumps

Using OpenStreetMap (Overpass API).

---

# **Room Sharing**

Photos

Gender Required

Age

Occupation

Smoking

Drinking

Veg/Non Veg

Pets

Rent

Deposit

Available From

Current Occupants

House Photos

Amenities

Map

Request Button  
---

# **Request Flow**

Tenant

↓

Send Request

↓

Owner gets Notification

↓

Owner opens request

↓

Accept

↓

Chat unlocked

↓

Phone Number visible

↓

Meet Offline

If rejected

Status

Rejected  
---

# **Saved Listings ❤️**

Users can

Save

↓

Wishlist

↓

Remove

↓

Receive alerts if

Rent changes

Owner updates photos

House becomes unavailable

---

# **Report Listing 🚨**

Reasons

Fake Listing

Wrong Price

Already Rented

Spam

Duplicate

Wrong Location

Scam

Other

Admin Dashboard

Shows

Listing

Reason

Reporter

Time

Priority  
---

# **Chat**

Not WhatsApp-like initially.

Simple.

Tenant

↓

Owner

↓

Messages

↓

Images

↓

Typing

↓

Seen

↓

Unread Count

Only unlocked after

Owner accepts request.

---

# **Reviews**

Tenant

Rates Owner

⭐

Owner

Rates Tenant

⭐

Comments

Trust Score

Owner

4.9

Tenant

4.7  
---

# **Notifications**

Push notifications

Examples

Owner accepted your request

New Message

House Updated

Price Reduced

Listing Expiring

Nearby Listing Added  
---

# **Owner Dashboard**

My Listings

My Requests

Analytics

Chats

Ratings

Bookmarks

Profile

Settings

Analytics

Views

Saved

Requests

Accepted

Rejected  
---

# **Tenant Dashboard**

Saved Listings

My Requests

Chats

Reviews

Profile

Settings  
---

# **Admin Dashboard**

Users

Listings

Reports

Analytics

Chats (reported only)

Categories

Verification

Revenue

---

# database tables

# **Database Structure**

## **Users**

id

name

email

phone

password

role

rating

profileImage

createdAt  
---

## **Listings**

id

ownerId

title

description

rent

deposit

location

latitude

longitude

type

status

views

createdAt  
---

## **Amenities**

id

listingId

wifi

parking

washingMachine

ac

fridge

kitchen

lift

gym

security  
---

## **Photos**

id

listingId

url  
---

## **Requests**

id

listingId

tenantId

status

message

createdAt  
---

## **Saved Listings**

id

userId

listingId  
---

## **Reviews**

id

reviewer

receiver

rating

comment  
---

## **Reports**

id

listingId

reporter

reason

status  
---

## **Messages**

id

chatId

sender

message

image

seen

createdAt  
---

## **Chats**

id

owner

tenant

listing  
---

# tech stack

# **Tech Stack**

Frontend

* React  
* Tailwind CSS  
* React Router  
* React Query

Backend

* Node.js  
* Express.js

Database

* PostgreSQL  
* Prisma ORM

Authentication

* JWT  
* Refresh Tokens  
* bcrypt

Storage

* Cloudinary

Maps

* OpenStreetMap  
* Leaflet  
* Overpass API

Search

* PostgreSQL Full Text Search  
* AI Query Parser (LLM-assisted)

Notifications

* Firebase Cloud Messaging (FCM) for push notifications (you can use just the messaging component without relying on Firebase Auth/Firestore)

Deployment

Frontend

* Vercel

Backend

* Railway / Render

Database

* Neon PostgreSQL

---

# plan

# **Development Roadmap**

## **Phase 1 – Core Platform (3–4 weeks)**

* Mobile app+web (React Native or Flutter)  
* User authentication  
* Rental listings  
* Room sharing  
* Maps  
* Photos  
* Request/accept flow  
* Contact reveal  
* Search and filters

## **Phase 2 – User Experience (2–3 weeks)**

* Saved listings  
* Chat  
* Ratings & reviews  
* Nearby places  
* Push notifications  
* Report system

## **Phase 3 – Intelligence & Growth (2–3 weeks)**

* AI search  
* Personalized recommendations  
* Analytics dashboards  
* Admin moderation tools  
* SEO and performance optimization

