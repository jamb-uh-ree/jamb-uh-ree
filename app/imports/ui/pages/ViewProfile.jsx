import React, { useEffect, useState } from 'react';
import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';
import { Button, Card, Col, Container, Image, Nav, Row } from 'react-bootstrap';
import './ViewProfileStyle.css';
import { NavLink, useParams, useLocation } from 'react-router-dom';
import { ComponentIDs, PageIDs } from '../utilities/ids';
import { Artists } from '../../api/artists/Artists';
import LoadingSpinner from '../components/LoadingSpinner';
import { ArtistsToGigs } from '../../api/artistsToGigs/ArtistsToGigs';
import { Gigs } from '../../api/gigs/Gigs';
import GigCard from '../components/GigCard';

const ViewProfile = () => {
  const id = useParams();
  const [artistToView, setArtistToView] = useState(null);
  const [gigObj, setGigObj] = useState([]);
  const [imageSrc, setImageSrc] = useState('');

  const { ready, currentUser } = useTracker(() => {
    const artistSub = Meteor.subscribe(Artists.userPublicationName);
    const artistToGigSub = Meteor.subscribe(ArtistsToGigs.userPublicationName);
    const gigSub = Meteor.subscribe(Gigs.userPublicationName);

    return {
      ready: artistSub.ready() && artistToGigSub.ready() && gigSub.ready(),
      currentUser: Meteor.user() ? Meteor.user().username : '',
    };
  }, []);

  useEffect(() => {
    if (ready) {
      const fetchedArtistToView = Artists.collection.findOne({ email: id.id });

      if (fetchedArtistToView) {
        setArtistToView(fetchedArtistToView);
        setImageSrc(fetchedArtistToView.image || '');

        const gigIds = ArtistsToGigs.collection.find({ artist_id: fetchedArtistToView._id }).map((doc) => doc.gig_id);
        const fetchedGigObj = Gigs.collection.find({ _id: { $in: gigIds } }).fetch();

        setGigObj(fetchedGigObj);
      } else {
        setArtistToView(null);
        setGigObj([]);
      }
    }
  }, [ready, id.id]);

  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const defaultImageSrc = '/images/profileImagePlaceholder.png';
  const handleImageError = () => {
    setImageSrc(defaultImageSrc);
  };

  return (!ready || !artistToView) ? (
    <LoadingSpinner />) :
    (
      <div id={PageIDs.viewProfilePage} className="viewProfile">
        <Container className="py-4">
          <Card id={ComponentIDs.viewProfileForm} className="card">

            <Card.Title>
              {/* NAME TITLE AND EMAIL */}
              <h1 className="text-center nameTitle">
                {artistToView.firstName} {artistToView.lastName}
              </h1>
              <p className="cardText text-center">{id.id}</p>
            </Card.Title>

            <Card.Body>

              {/* IMAGE */}
              <Row className="d-flex justify-content-center">
                <Col xs={12} md={4} className="d-flex align-items-center image-col">
                  <Image
                    src={imageSrc}
                    height={100}
                    className="mx-auto d-block img-fluid image"
                    onError={handleImageError}
                  />
                </Col>

                {/* INFO */}
                <Col xs={12} md={8} className="info-col">

                  {/* INSTRUMENTS & SKILL LEVEL */}
                  <Row>
                    <Col className="text-start">
                      <h4 className="cardLabel">Instrument{artistToView.instruments.length > 1 ? 's' : ''} Played</h4>
                      <p className="cardText">{artistToView.instruments.join(', ')}</p>
                    </Col>
                    <Col className="text-start">
                      <h4 className="cardLabel">Skill-Level</h4>
                      <p className="cardText">{artistToView.skillLevel}</p>
                    </Col>
                  </Row>

                  <br />

                  {/* INSTRUMENTS AND INFLUENCES */}
                  <Row>
                    {/* GENRES */}
                    <Col className="text-start">
                      <h4 className="cardLabel">Genres:</h4>
                      <p className="cardText">{artistToView.genres.join(', ')}</p>
                    </Col>

                    <Col>
                      <h4 className="cardLabel">Influences</h4>
                      <p className="cardText">{artistToView.influences.join(', ')}</p>
                    </Col>
                  </Row>

                  <br />

                  {/* BIO */}
                  <Row>
                    <Col className="text-start">
                      <h4 className="cardLabel">Bio:</h4>
                      <p className="cardText">{artistToView.bio}</p>
                    </Col>
                  </Row>

                </Col>
              </Row>

              {/* EDIT PROFILE BUTTON */}
              {currentUser === id.id && (
                <Row>
                  <Col className="text-end mt-3">
                    <Button className="editProfileButton">
                      <Nav.Link
                        className="EditProfileStyle.css"
                        as={NavLink}
                        id={ComponentIDs.createJamSession}
                        to="/editProfile"
                        key="editProfile"
                      >
                        Edit Profile
                      </Nav.Link>
                    </Button>
                  </Col>
                </Row>
              )}

            </Card.Body>
          </Card>

          {/* JOINED GIGS */}
          <div>
            {gigObj.length > 0 && (
              <>
                <h3 className="text-center py-2">
                  Jam Sessions that {artistToView.firstName} has joined:
                </h3>
                <div className="gig-grid">
                  {gigObj.map((gig) => (
                    <div key={gig._id}>
                      <GigCard gigEntry={gig} />
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

        </Container>
      </div>
    );
};
export default ViewProfile;
