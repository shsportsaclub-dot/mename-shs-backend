const L = { id: 40, name: 'South Africa', code: 'SA', image_path: 'https://x/sa.png' }, V = { id: 41, name: 'Australia', code: 'AUS', image_path: 'https://x/au.png' };
const fixture = {
  id: 3, league_id: 3, round: '2nd T20I', localteam_id: 40, visitorteam_id: 41, starting_at: '2018-10-12T16:00:00.000000Z', type: 'T20I', live: 0, status: 'Finished',
  note: 'South Africa won by 6 wickets (with 26 balls remaining)', venue_id: 96, toss_won_team_id: 41, winner_team_id: 40, first_umpire_id: 36, second_umpire_id: 127, tv_umpire_id: 37, referee_id: 15,
  man_of_match_id: 80, elected: 'batting', localteam: { data: L }, visitorteam: { data: V }, venue: { data: { name: 'Eden Park', city: 'Auckland' } },
  runs: { data: [{ team_id: 41, inning: 1, score: 150, wickets: 5, overs: 20 }, { team_id: 40, inning: 1, score: 151, wickets: 4, overs: 16.4 }] },
  firstumpire: { data: { fullname: 'Umpire One' } }, secondumpire: { data: { fullname: 'Umpire Two' } }, tvumpire: { data: { fullname: 'Umpire TV' } }, referee: { data: { fullname: 'Ref Eree' } },
  manofmatch: { data: { fullname: 'Star Player' } }, tosswon: { data: V },
  batting: { data: [
    { player_id: 1, team_id: 41, scoreboard: 'S1', score: 60, ball: 40, four_x: 5, six_x: 2, rate: 150, fow_score: 90, fow_balls: 12.3, sort: 1, batsman: { data: { fullname: 'Aaron Finch' } } },
    { player_id: 2, team_id: 41, scoreboard: 'S1', score: 30, ball: 20, four_x: 2, six_x: 1, rate: 150, fow_score: 40, fow_balls: 6.1, sort: 2, batsman: { data: { fullname: 'D Short' } } },
    { player_id: 3, team_id: 40, scoreboard: 'S2', score: 70, ball: 50, four_x: 6, six_x: 1, rate: 140, active: true, sort: 1, batsman: { data: { fullname: 'Q de Kock' } } }] },
  bowling: { data: [{ player_id: 9, team_id: 40, scoreboard: 'S1', overs: 4, medians: 0, runs: 30, wickets: 2, rate: 7.5, bowler: { data: { fullname: 'K Rabada' } } }] },
  lineup: { data: [
    { id: 1, team_id: 41, fullname: 'Aaron Finch', position: { name: 'Batsman' }, lineup: { team_id: 41, captain: true, wicketkeeper: false, substitution: false } },
    { id: 7, team_id: 41, fullname: 'Bench Guy', lineup: { team_id: 41, substitution: true } },
    { id: 3, team_id: 40, fullname: 'Q de Kock', lineup: { team_id: 40, wicketkeeper: true, substitution: false } }] },
  balls: { data: [{ ball: 0.1, score: { data: { name: 'Four', runs: 4, four: true, is_wicket: false } }, batsman: { data: { fullname: 'A' } }, bowler: { data: { fullname: 'B' } } }, { ball: 0.2, score: { data: { name: 'Wicket', runs: 0, is_wicket: true, out: true } } }] }
};
export { fixture, L, V };
