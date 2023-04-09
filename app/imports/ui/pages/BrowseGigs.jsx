import React, { useState } from 'react';
import { Meteor } from 'meteor/meteor';
import './BrowseGigsStyle.css';
import { Button, Container } from 'react-bootstrap';
import { useTracker } from 'meteor/react-meteor-data';
import { Filter } from 'react-bootstrap-icons';
import LoadingSpinner from '../components/LoadingSpinner';
import GigCard from '../components/GigCard';
import GigFilterForm from '../components/GigFilterForm';
import { Gigs } from '../../api/gigs/Gigs';

const getUniqueInstruments = (gigs) => {
  const instruments = new Set();
  gigs.forEach((gig) => gig.instruments.forEach((instrument) => instruments.add(instrument)));
  return Array.from(instruments);
};

const getUniqueGenres = (gigs) => {
  const genres = new Set();
  gigs.forEach((gig) => gig.genres.forEach((genre) => genres.add(genre)));
  return Array.from(genres);
};

const getUniqueSkillLevels = (gigs) => {
  const skillLevels = new Set();
  gigs.forEach((gig) => skillLevels.add(gig.skillLevel));
  return Array.from(skillLevels);
};

const BrowseGigs = () => {
  const [showFilter, setShowFilter] = useState(false);
  const [filter, setFilter] = useState({ instrument: '', genre: '', skillLevel: '' });

  // useTracker connects Meteor data to React components. https://guide.meteor.com/react.html#using-withTracker
  const { ready, gigs } = useTracker(() => {
    const subscription = Meteor.subscribe(Gigs.userPublicationName);
    const rdy = subscription.ready();
    const gigItems = Gigs.collection.find().fetch();
    return {
      gigs: gigItems,
      ready: rdy,
    };
  }, []);

  const handleFilterClick = () => {
    setShowFilter(!showFilter);
  };

  const uniqueInstruments = getUniqueInstruments(gigs);
  const uniqueGenres = getUniqueGenres(gigs);
  const uniqueSkillLevels = getUniqueSkillLevels(gigs);

  return (ready ? (
    <div className="browseGigs">
      <Container className="py-3">
        {/* FILTER BUTTON */}
        <div>
          <Button onClick={handleFilterClick} className="filterButton">
            <Filter size="24px" />
          </Button>
          {showFilter && (
            <GigFilterForm
              filter={filter}
              setFilter={setFilter}
              instruments={uniqueInstruments}
              genres={uniqueGenres}
              skillLevels={uniqueSkillLevels}
            />
          )}
        </div>

        {/* GIG CARDS */}
        <div className="gig-grid">
          {gigs
            .filter((gig) => {
              if (filter.instrument && !gig.instruments.includes(filter.instrument)) {
                return false;
              }
              if (filter.genre && !gig.genres.includes(filter.genre)) {
                return false;
              }
              return !(filter.skillLevel && gig.skillLevel !== filter.skillLevel);

            })
            .map((gig) => (
              <div key={gig._id}>
                <GigCard gigEntry={gig} />
              </div>
            ))}
        </div>
      </Container>
    </div>
  ) :
    <LoadingSpinner />
  );
};

export default BrowseGigs;