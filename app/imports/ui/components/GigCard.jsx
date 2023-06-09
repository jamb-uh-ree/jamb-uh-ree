import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import './GigCardStyle.css';
import { Card, Image, ListGroup, Button, Col } from 'react-bootstrap';
import { useTracker } from 'meteor/react-meteor-data';
import { Meteor } from 'meteor/meteor';
import moment from 'moment';
import { FaSkullCrossbones } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { Artists } from '../../api/artists/Artists';
import { ArtistsToGigs } from '../../api/artistsToGigs/ArtistsToGigs';
import { deleteGigAndLinks } from '../../startup/both/collectionHelpers';

// Maximum Length of Attendees that should be displayed
const MAX_CARD_ATTENDEES_LEN = 10;
// Maximum Length of Genre(s) that should be displayed
const MAX_CARD_GENRES_LEN = 125;
// Maximum Length of Genre(s) that should be displayed
const MAX_CARD_INSTRUMENTS_LEN = 115;
// Maximum Length of Genre(s) that should be displayed
const MAX_CARD_VENUE_LEN = 125;
// Maximum Length of About that should be displayed
const MAX_CARD_ABOUT_LEN = 225;
// A function used to truncate card data to a length specified by maxlen
const truncateTo = (data, maxlen) => {
  if (data.length <= maxlen) {
    return data;
  }
  const truncatedData = data.slice(0, maxlen);
  const lastWord = truncatedData.lastIndexOf(' ');
  const truncatedDataWord = truncatedData.slice(0, lastWord);
  return `${truncatedDataWord}...`;
};

/** Renders a single row in the List Stuff table. See pages/ListStuff.jsx. */
const GigCard = ({ gigEntry, userRole }) => {
  const { ready, artistData, attendees } = useTracker(() => {
    const artistSub = Meteor.subscribe(Artists.userPublicationName);
    const artistToGigSub = Meteor.subscribe(ArtistsToGigs.userPublicationName);
    const rdy = artistSub.ready() && artistToGigSub.ready();
    const currentUser = Meteor.user();
    const currentArtist = currentUser && Artists.collection.findOne({ email: currentUser.emails[0].address });
    const artists = Artists.collection.find().fetch();
    const joinedArtistIds = ArtistsToGigs.collection.find({ gig_id: gigEntry._id }).map((doc) => doc.artist_id);
    const joinedArtists = artists.filter((artist) => joinedArtistIds.includes(artist._id));
    // const whosGoing = joinedArtists.map((artist) => artist.firstName);

    return {
      ready: rdy,
      artistData: currentArtist,
      attendees: joinedArtists };
  });

  const [joined, setJoined] = useState(false);
  const [buttonDisabled, setButtonDisabled] = useState(false);

  const [imageSrc, setImageSrc] = useState(gigEntry.image);
  const defaultImageSrc = '/images/default_jamsession_image.png';
  const handleImageError = () => {
    setImageSrc(defaultImageSrc);
  };

  const isAdmin = userRole === 'admin';

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this jam session?')) {
      deleteGigAndLinks(gigEntry._id);
    }
  };

  useEffect(() => {
    if (artistData && ArtistsToGigs.collection.find({ artist_id: artistData._id, gig_id: gigEntry._id }).count() > 0) {
      setJoined(true);
    }
  }, [artistData, gigEntry._id]);

  const joinGig = () => {
    if (!artistData) {
      alert('You need to be signed in and have an artist profile to join a gig.');
      return;
    }

    if (!joined) {
      Meteor.call('artistsToGigs.insert', artistData._id, gigEntry._id, (error) => {
        if (error) {
          alert(`An error occurred while joining the gig: ${error.message}`);
        } else {
          setJoined('Joined');
          setButtonDisabled(true);
          setTimeout(() => {
            setJoined('Join');
            setButtonDisabled(false);
          }, 500);
        }
      });
    } else {
      Meteor.call('artistsToGigs.remove', artistData._id, gigEntry._id, (error) => {
        if (error) {
          alert(`An error occurred while leaving the gig: ${error.message}`);
        } else {
          setJoined(false);
        }
      });
    }
  };

  return ready ? (
    <div className="gigCard">
      <Card className="h-100">

        {/* ADMIN DELETE BUTTON */}
        <div className="adminDeleteButton">
          {isAdmin && (
            <Button
              variant="danger"
              className="delUser d-flex justify-content-center align-content-center"
              onClick={handleDelete}
            >
              <FaSkullCrossbones />
            </Button>
          )}
        </div>

        {/* TITLE AND IMAGE */}
        <Card.Header>
          <div className="d-flex justify-content-center">
            <Card.Title>{gigEntry.title}</Card.Title>
          </div>
          <div className="d-flex justify-content-center">
            <Image
              src={imageSrc}
              height={150}
              className="image-shadow"
              onError={handleImageError}
            />
          </div>
        </Card.Header>
        <ListGroup variant="flush">

          {/* ATTENDEES */}
          <ListGroup.Item className="d-flex justify-content-between align-items-center attendees">
            <div className="label fw-bold d-flex justify-content-start">Attendees: </div>
            <div className="content" style={{ minWidth: '150px', wordBreak: 'break-word' }}>
              {attendees.map((attendee, index) => (
                index < MAX_CARD_ATTENDEES_LEN ? (
                  <React.Fragment key={attendee._id}>
                    {index === 0 ? '' : ', '}
                    <span style={{ display: 'inline-block' }}>
                      <Link to={`/viewProfile/${attendee.email}`} className="attendee-link">
                        {attendee.firstName}
                      </Link>
                    </span>
                  </React.Fragment>
                ) : null
              ))}
            </div>
          </ListGroup.Item>

          {/* DATE AND SKILL-LEVEL */}
          <ListGroup.Item className="d-flex justify-content-between align-items-center skill-level">
            <Col className="d-flex align-content-center">
              <div className="label fw-bold d-flex justify-content-start">Date: </div>
              <div className="content">{moment(gigEntry.date).format('MMMM Do YYYY, h:mm a')}</div>
            </Col>
            <Col className="d-flex align-content-center">
              <div className="label">Skill-Level: </div>
              <div className="content align-content-center">{gigEntry.skillLevel}</div>
            </Col>
          </ListGroup.Item>

          {/* GENRES */}
          <ListGroup.Item className="d-flex justify-content-between align-items-center genres">
            <span className="label fw-bold d-flex justify-content-start">Genre(s): </span>
            <span className="content">{truncateTo(gigEntry.genres.join(', '), MAX_CARD_GENRES_LEN)}</span>
          </ListGroup.Item>

          {/* INSTRUMENTS */}
          <ListGroup.Item className="d-flex justify-content-between align-items-center instruments">
            <span className="label fw-bold d-flex justify-content-start">Instruments: </span>
            <span className="content">{truncateTo(gigEntry.instruments.join(', '), MAX_CARD_INSTRUMENTS_LEN)}</span>
          </ListGroup.Item>

          {/* VENUE */}
          <ListGroup.Item className="d-flex justify-content-between align-items-center venue">
            <span className="label fw-bold d-flex justify-content-start">Venue: </span>
            <span className="content">{truncateTo(gigEntry.venue, MAX_CARD_VENUE_LEN)}</span>
          </ListGroup.Item>

          {/* ABOUT */}
          <ListGroup.Item className="d-flex justify-content-between align-items-center about">
            <span className="label fw-bold d-flex justify-content-start w-100">About: </span>
            <span className="content">{truncateTo(gigEntry.about, MAX_CARD_ABOUT_LEN)}</span>
          </ListGroup.Item>

          <Card.Footer>
            {/* JOIN BUTTON */}
            <div className="d-flex justify-content-end align-content-center m-3 joinButtonSpan">
              <Button className={`btn ${joined ? 'leaveButton' : 'joinButton'}`} onClick={joinGig} disabled={buttonDisabled}>
                {joined ? 'Leave' : 'Join'}
              </Button>
            </div>
          </Card.Footer>
        </ListGroup>

      </Card>
    </div>
  ) : null;
};

GigCard.propTypes = {
  gigEntry: PropTypes.shape({
    title: PropTypes.string,
    image: PropTypes.string,
    date: PropTypes.instanceOf(Date),
    attendees: PropTypes.arrayOf(PropTypes.string),
    skillLevel: PropTypes.string,
    genres: PropTypes.arrayOf(PropTypes.string),
    instruments: PropTypes.arrayOf(PropTypes.string),
    venue: PropTypes.string,
    about: PropTypes.string,
    _id: PropTypes.string,
  }),
  userRole: PropTypes.string,
}.isRequired;

export default GigCard;
