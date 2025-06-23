import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { componentScoreService } from '../../services/componentScoreService';
import type { ComponentProgress, CreateComponentScoreRequest, User } from '../../types/api';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '../ui/alert-dialog';

interface StudentGradeTrackingProps {
  courseId: string;
}

export function StudentGradeTracking({ courseId }: StudentGradeTrackingProps) {
  const { user } = useAuth();
  const [componentProgress, setComponentProgress] = useState<ComponentProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<string | null>(null);

  const fetchComponentProgress = useCallback(async () => {
    try {
      setLoading(true);
      const progress = await componentScoreService.getComponentProgress(courseId);
      setComponentProgress(progress);
    } catch (error) {
      console.error('Error fetching component progress:', error);
      alert('Failed to load grade components');
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    if (courseId) {
      fetchComponentProgress();
    }
  }, [courseId, fetchComponentProgress]);

  const handleSubmitScore = async (
    componentId: string,
    pointsEarned: number,
    feedback?: string
  ) => {
    if (!user) return;

    try {
      setSubmitting(componentId);
      const scoreData: CreateComponentScoreRequest = {
        gradeComponentId: componentId,
        courseId,
        pointsEarned,
        feedback
      };

      await componentScoreService.createComponentScore(scoreData);
      alert('Points submitted successfully!');
      await fetchComponentProgress(); // Refresh the data
    } catch (error: unknown) {
      console.error('Error submitting score:', error);
      const errorMessage =
        error instanceof Error && error.message ? error.message : 'Failed to submit points';
      alert(errorMessage);
    } finally {
      setSubmitting(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Loading grade components...</div>
      </div>
    );
  }

  if (componentProgress.length === 0) {
    return (
      <div className="text-center p-8">
        <div className="text-muted-foreground">No grade components found for this course.</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Grade Components</h2>
        <div className="text-sm text-muted-foreground">Submit your points for each component</div>
      </div>

      <div className="grid gap-6">
        {componentProgress.map((progress) => (
          <ComponentCard
            key={progress.gradeComponent.id}
            progress={progress}
            onSubmitScore={handleSubmitScore}
            isSubmitting={submitting === progress.gradeComponent.id}
            user={user}
          />
        ))}
      </div>
    </div>
  );
}

interface ComponentCardProps {
  progress: ComponentProgress;
  onSubmitScore: (componentId: string, pointsEarned: number, feedback?: string) => Promise<void>;
  isSubmitting: boolean;
  user: User | null;
}

function ComponentCard({ progress, onSubmitScore, isSubmitting, user }: ComponentCardProps) {
  const [pointsEarned, setPointsEarned] = useState('');
  const [feedback, setFeedback] = useState('');
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);

  const { gradeComponent, currentScore, progressPercentage, isPassingMinimum, pointsNeededToPass } =
    progress;

  const handleSubmit = async () => {
    const points = parseFloat(pointsEarned);
    if (isNaN(points) || points < 0 || points > gradeComponent.totalPoints) {
      alert(`Points must be between 0 and ${gradeComponent.totalPoints}`);
      return;
    }

    await onSubmitScore(gradeComponent.id, points, feedback || undefined);
    setPointsEarned('');
    setFeedback('');
    setShowSubmitDialog(false);
  };

  const getStatusBadge = () => {
    if (currentScore) {
      if (currentScore.isGraded) {
        return <Badge variant={isPassingMinimum ? 'default' : 'destructive'}>Graded</Badge>;
      } else if (currentScore.isSubmitted) {
        return <Badge variant="secondary">Submitted</Badge>;
      }
    }
    return <Badge variant="outline">Not Submitted</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              {gradeComponent.name}
              {getStatusBadge()}
            </CardTitle>
            <CardDescription>
              Category: {gradeComponent.category} • Weight: {gradeComponent.weight}%
              {gradeComponent.isMandatory && ' • Mandatory'}
            </CardDescription>
          </div>
          <div className="text-right">
            <div className="text-lg font-semibold">
              {currentScore ? currentScore.pointsEarned : 0} / {gradeComponent.totalPoints}
            </div>
            <div className="text-sm text-muted-foreground">points</div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progress</span>
            <span>{progressPercentage.toFixed(1)}%</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="font-medium">Minimum Required</div>
            <div className="text-muted-foreground">{gradeComponent.minimumScore} points</div>
          </div>
          <div>
            <div className="font-medium">Points Needed to Pass</div>
            <div className={`${pointsNeededToPass > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {pointsNeededToPass > 0 ? `${pointsNeededToPass} more` : 'Passed ✓'}
            </div>
          </div>
        </div>

        {currentScore && (
          <div className="p-3 bg-muted rounded-lg">
            <div className="font-medium">Current Submission</div>
            <div className="text-sm text-muted-foreground">
              Submitted: {new Date(currentScore.createdAt).toLocaleDateString()}
            </div>
            {currentScore.feedback && (
              <div className="text-sm mt-1">
                <span className="font-medium">Feedback:</span> {currentScore.feedback}
              </div>
            )}
          </div>
        )}

        {user?.role === 'student' && (!currentScore || !currentScore.isGraded) && (
          <AlertDialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
            <AlertDialogTrigger asChild>
              <Button
                variant={currentScore ? 'outline' : 'default'}
                className="w-full"
                disabled={isSubmitting}
              >
                {currentScore ? 'Update Points' : 'Submit Points'}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  {currentScore ? 'Update' : 'Submit'} Points for {gradeComponent.name}
                </AlertDialogTitle>
                <AlertDialogDescription>
                  Enter the points you earned for this component (0 - {gradeComponent.totalPoints}).
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="points">Points Earned</Label>
                  <Input
                    id="points"
                    type="number"
                    min="0"
                    max={gradeComponent.totalPoints}
                    step="0.01"
                    value={pointsEarned}
                    onChange={(e) => setPointsEarned(e.target.value)}
                    placeholder={`Enter points (max: ${gradeComponent.totalPoints})`}
                  />
                </div>
                <div>
                  <Label htmlFor="feedback">Additional Notes (Optional)</Label>
                  <Textarea
                    id="feedback"
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Add any additional notes or comments..."
                    rows={3}
                  />
                </div>
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleSubmit} disabled={isSubmitting}>
                  {isSubmitting ? 'Submitting...' : 'Submit'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </CardContent>
    </Card>
  );
}
