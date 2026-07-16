
import { Heart, MessageCircleCode } from "lucide-react";


type Props = {
  _id?: string;
  image: string;
  category: string;
  title: string;
  description: string;
  author: {name: string, img: string}
  date: string;
  like: {count: number, isliked: Boolean}
  readTime: string;
};

export default function PostCard({ post, onLike } : { post: Props; onLike: ((id:string) => void) }) {
  return (
    <div className="group bg-panel border border-edge overflow-hidden hover:border-em/60 transition-colors duration-300 h-full flex flex-col">
      {/* Image */}
      <div className="overflow-hidden">
        <img
          src={post.image}
          alt={post.title}
          className="w-full h-48 object-cover group-hover:scale-[1.03] transition-transform duration-500"
        />
      </div>

      {/* Content */}
      <div className="p-5 space-y-3 flex-1 flex flex-col">
        {/* Category Tag */}
        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="uppercase tracking-widest text-em border border-edge-heavy px-2 py-1">
            {post.category}
          </span>
          <span className="text-ash-dim">• {post.readTime}</span>
        </div>

        {/* Title */}
        <h2 className="text-lg font-semibold text-ink leading-snug pt-2 group-hover:text-em transition-colors cursor-pointer">
          {post.title}
        </h2>

        {/* Description */}
        <p className="text-sm text-ash line-clamp-3 flex-1">
          {post.description}
        </p>

        {/* Footer: Author & Date */}
        <div className="flex items-center justify-between text-sm text-ash-dim pt-3 border-t border-edge">
          <div className="flex items-center justify-between w-full">
            <div className="gap-2 flex items-center">
              <img
                src={post.author.img}
                alt={post.author.name}
                className="w-6 h-6 rounded-full object-cover border border-edge-heavy"
              />
              {/* Stack author name and date vertically */}
              <div className="flex flex-col leading-tight">
                <span className="font-medium text-ink">{post.author.name}</span>
                <span className="font-mono text-xs text-ash-dim">{post.date}</span>
              </div>
            </div>
            <div className="flex gap-3 text-ash-dim">
              <span
              onClick={(e) => {
                e.stopPropagation()
                if(post._id) onLike(post._id)
              }}
              className="flex gap-1 hover:text-em transition-colors"> <Heart fill={post.like.isliked ? "#10b981" : "none"} stroke={post.like.isliked ? "#10b981" : "currentColor"} size={18} /> {post.like.count} </span>
              <span className="flex gap-1"> <MessageCircleCode size={18} /> 59 </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
