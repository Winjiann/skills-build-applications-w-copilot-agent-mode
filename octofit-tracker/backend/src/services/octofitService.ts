import mongoose from 'mongoose';
import { Activity, Team, User, Workout } from '../models/index.js';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function badRequest(message: string): never {
  throw Object.assign(new Error(message), { status: 400 });
}

function activityFocus(type: string): string {
  const normalized = type.trim().toLowerCase();
  if (['run', 'cycle', 'walk'].includes(normalized)) return 'endurance';
  if (normalized === 'strength') return 'strength';
  return normalized;
}

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  if (!isRecord(input)) badRequest('Activity details are required');
  const { userId, teamId, type, minutes } = input;
  if (typeof userId !== 'string' || !mongoose.isValidObjectId(userId)) badRequest('A valid userId is required');
  if (typeof teamId !== 'string' || !mongoose.isValidObjectId(teamId)) badRequest('A valid teamId is required');
  if (typeof type !== 'string' || !type.trim()) badRequest('An activity type is required');
  if (typeof minutes !== 'number' || !Number.isFinite(minutes) || minutes < 1) {
    badRequest('Minutes must be at least one');
  }

  const [user, team] = await Promise.all([User.exists({ _id: userId }), Team.exists({ _id: teamId })]);
  if (!user || !team) badRequest('The referenced user and team must exist');

  return Activity.create({
    user: userId,
    team: teamId,
    type: type.trim(),
    minutes,
    points: minutes,
    occurredAt: new Date(),
  });
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  if (!isRecord(input)) badRequest('Team details are required');
  const { name, mascot, members } = input;
  if (typeof name !== 'string' || !name.trim()) badRequest('A team name is required');
  if (typeof mascot !== 'string' || !mascot.trim()) badRequest('A team mascot is required');
  if (members !== undefined && !Array.isArray(members)) badRequest('Team members must be an array');

  const memberIds: string[] = [];
  for (const member of members ?? []) {
    if (typeof member !== 'string' || !mongoose.isValidObjectId(member)) {
      badRequest('Each team member must have a valid ID');
    }
    memberIds.push(member);
  }
  const uniqueMemberIds = [...new Set(memberIds)];
  if (uniqueMemberIds.length > 0) {
    const existingMembers = await User.countDocuments({ _id: { $in: uniqueMemberIds } });
    if (existingMembers !== uniqueMemberIds.length) badRequest('All team members must exist');
  }

  return Team.create({ name: name.trim(), mascot: mascot.trim(), members: memberIds });
}

export async function getLeaderboard() {
  const [teams, totals] = await Promise.all([
    Team.find().lean(),
    Activity.aggregate<{ _id: mongoose.Types.ObjectId; totalPoints: number }>([
      { $group: { _id: '$team', totalPoints: { $sum: '$points' } } },
    ]),
  ]);
  const pointsByTeam = new Map(totals.map(({ _id, totalPoints }) => [_id.toString(), totalPoints]));
  return teams
    .map((team) => ({ teamName: team.name, totalPoints: pointsByTeam.get(team._id.toString()) ?? 0 }))
    .sort((left, right) => right.totalPoints - left.totalPoints || left.teamName.localeCompare(right.teamName))
    .map((team, index) => ({ ...team, rank: index + 1 }));
}

export async function suggestWorkouts(userEmail: string) {
  const user = await User.findOne({ email: userEmail.trim().toLowerCase() }).lean();
  if (!user) throw Object.assign(new Error('User not found'), { status: 404 });

  const [workouts, activities] = await Promise.all([
    Workout.find().lean(),
    Activity.find({ user: user._id }).sort({ occurredAt: -1 }).limit(10).lean(),
  ]);
  const goal = user.fitnessGoal?.trim().toLowerCase();
  const matchingGoal = goal ? workouts.find((workout) => workout.focus.toLowerCase() === goal) : undefined;
  const activityRecommendation = activities
    .map((activity) => ({
      activity,
      workout: workouts.find((workout) => workout.focus.toLowerCase() === activityFocus(activity.type)),
    }))
    .find(({ workout }) => workout !== undefined);
  const preferredFocus = matchingGoal?.focus ?? activityRecommendation?.workout?.focus;
  const orderedWorkouts = preferredFocus
    ? [
        ...workouts.filter((workout) => workout.focus.toLowerCase() === preferredFocus.toLowerCase()),
        ...workouts.filter((workout) => workout.focus.toLowerCase() !== preferredFocus.toLowerCase()),
      ]
    : workouts;

  return orderedWorkouts.map((workout) => {
    let reason = `A ${workout.focus} workout to support your fitness goals.`;
    if (matchingGoal && workout.focus.toLowerCase() === matchingGoal.focus.toLowerCase()) {
      reason = `Recommended to support your ${user.fitnessGoal} goal.`;
    } else if (
      activityRecommendation?.workout &&
      workout.focus.toLowerCase() === activityRecommendation.workout.focus.toLowerCase()
    ) {
      reason = `Recommended based on your recent ${activityRecommendation.activity.type} activity.`;
    }
    return { ...workout, reason };
  });
}

export { User };
