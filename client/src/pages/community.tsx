import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import DashboardNav from "@/components/dashboard-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { 
  Loader2, 
  Heart, 
  MessageCircle, 
  Send, 
  Trash2,
  Users 
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const postSchema = z.object({
  content: z.string().min(1, "Post content is required"),
});

const commentSchema = z.object({
  content: z.string().min(1, "Comment is required"),
});

export default function Community() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedPost, setSelectedPost] = useState<number | null>(null);

  const form = useForm({
    resolver: zodResolver(postSchema),
    defaultValues: {
      content: "",
    },
  });

  const commentForm = useForm({
    resolver: zodResolver(commentSchema),
    defaultValues: {
      content: "",
    },
  });

  const { data: posts, isLoading: isLoadingPosts } = useQuery({
    queryKey: ["/api/posts"],
  });

  const { data: comments, isLoading: isLoadingComments } = useQuery({
    queryKey: ["/api/posts", selectedPost, "comments"],
    enabled: selectedPost !== null,
  });

  const { data: likes, isLoading: isLoadingLikes } = useQuery({
    queryKey: ["/api/posts", selectedPost, "likes"],
    enabled: selectedPost !== null,
  });

  const createPostMutation = useMutation({
    mutationFn: async (data: z.infer<typeof postSchema>) => {
      const res = await apiRequest("POST", "/api/posts", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      form.reset();
      toast({
        title: "Post created",
        description: "Your post has been published successfully",
      });
    },
  });

  const deletePostMutation = useMutation({
    mutationFn: async (postId: number) => {
      await apiRequest("DELETE", `/api/posts/${postId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      toast({
        title: "Post deleted",
        description: "Your post has been removed",
      });
    },
  });

  const createCommentMutation = useMutation({
    mutationFn: async ({ postId, data }: { postId: number; data: z.infer<typeof commentSchema> }) => {
      const res = await apiRequest("POST", `/api/posts/${postId}/comments`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts", selectedPost, "comments"] });
      commentForm.reset();
    },
  });

  const toggleLikeMutation = useMutation({
    mutationFn: async ({ postId, isLiked }: { postId: number; isLiked: boolean }) => {
      if (isLiked) {
        await apiRequest("DELETE", `/api/posts/${postId}/likes`);
      } else {
        await apiRequest("POST", `/api/posts/${postId}/likes`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts", selectedPost, "likes"] });
    },
  });

  function onSubmitPost(data: z.infer<typeof postSchema>) {
    createPostMutation.mutate(data);
  }

  function onSubmitComment(data: z.infer<typeof commentSchema>) {
    if (selectedPost) {
      createCommentMutation.mutate({ postId: selectedPost, data });
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav />
      
      <main className="pl-64 p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl mx-auto"
        >
          <h1 className="text-3xl font-bold mb-8">Community</h1>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Create Post</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmitPost)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Textarea
                            placeholder="Share your fitness journey..."
                            className="min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={createPostMutation.isPending}
                  >
                    {createPostMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Post
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          {isLoadingPosts ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-green-600" />
            </div>
          ) : posts?.length > 0 ? (
            <div className="space-y-4">
              {posts.map((post: any) => (
                <Card key={post.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <p className="font-medium">{post.username}</p>
                        <p className="text-sm text-gray-500">
                          {format(new Date(post.createdAt), "MMM d, yyyy 'at' h:mm a")}
                        </p>
                      </div>
                      {post.userId === user?.id && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deletePostMutation.mutate(post.id)}
                          disabled={deletePostMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      )}
                    </div>

                    <p className="mb-4">{post.content}</p>

                    <div className="flex items-center gap-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const isLiked = likes?.some(
                            (like: any) => like.userId === user?.id
                          );
                          toggleLikeMutation.mutate({
                            postId: post.id,
                            isLiked: !!isLiked,
                          });
                        }}
                        disabled={toggleLikeMutation.isPending}
                      >
                        <Heart
                          className={`h-4 w-4 mr-1 ${
                            likes?.some((like: any) => like.userId === user?.id)
                              ? "fill-red-500 text-red-500"
                              : "text-gray-500"
                          }`}
                        />
                        {likes?.length || 0}
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedPost(post.id)}
                      >
                        <MessageCircle className="h-4 w-4 mr-1 text-gray-500" />
                        {comments?.length || 0}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-8">
                <div className="text-center text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>No posts yet. Be the first to share your journey!</p>
                </div>
              </CardContent>
            </Card>
          )}

          <Dialog open={selectedPost !== null} onOpenChange={() => setSelectedPost(null)}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Comments</DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                {isLoadingComments ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin text-green-600" />
                  </div>
                ) : comments?.length > 0 ? (
                  comments.map((comment: any) => (
                    <div
                      key={comment.id}
                      className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{comment.username}</p>
                        <p className="text-sm text-gray-500">
                          {format(new Date(comment.createdAt), "MMM d, yyyy")}
                        </p>
                        <p className="mt-2">{comment.content}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-500 py-4">
                    No comments yet. Start the conversation!
                  </p>
                )}

                <Form {...commentForm}>
                  <form
                    onSubmit={commentForm.handleSubmit(onSubmitComment)}
                    className="flex gap-2"
                  >
                    <FormField
                      control={commentForm.control}
                      name="content"
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormControl>
                            <Input
                              placeholder="Write a comment..."
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="submit"
                      size="icon"
                      disabled={createCommentMutation.isPending}
                    >
                      {createCommentMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </form>
                </Form>
              </div>
            </DialogContent>
          </Dialog>
        </motion.div>
      </main>
    </div>
  );
}
