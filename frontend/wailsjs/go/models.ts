export namespace ai {
	
	export class AIResponse {
	    content: string;
	    usage?: Record<string, any>;
	    raw?: any;
	
	    static createFrom(source: any = {}) {
	        return new AIResponse(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.content = source["content"];
	        this.usage = source["usage"];
	        this.raw = source["raw"];
	    }
	}
	export class AudioRequest {
	    projectId?: number;
	    prompt: string;
	    images?: string[];
	    videos?: string[];
	    audios?: string[];
	    model: string;
	    providerId: number;
	    voice?: string;
	    speed?: number;
	    options?: Record<string, any>;
	
	    static createFrom(source: any = {}) {
	        return new AudioRequest(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.projectId = source["projectId"];
	        this.prompt = source["prompt"];
	        this.images = source["images"];
	        this.videos = source["videos"];
	        this.audios = source["audios"];
	        this.model = source["model"];
	        this.providerId = source["providerId"];
	        this.voice = source["voice"];
	        this.speed = source["speed"];
	        this.options = source["options"];
	    }
	}
	export class ImageRequest {
	    projectId?: number;
	    prompt: string;
	    images?: string[];
	    videos?: string[];
	    audios?: string[];
	    model: string;
	    providerId: number;
	    size?: string;
	    quality?: string;
	    style?: string;
	    options?: Record<string, any>;
	
	    static createFrom(source: any = {}) {
	        return new ImageRequest(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.projectId = source["projectId"];
	        this.prompt = source["prompt"];
	        this.images = source["images"];
	        this.videos = source["videos"];
	        this.audios = source["audios"];
	        this.model = source["model"];
	        this.providerId = source["providerId"];
	        this.size = source["size"];
	        this.quality = source["quality"];
	        this.style = source["style"];
	        this.options = source["options"];
	    }
	}
	export class Model {
	    id: string;
	    owner?: string;
	    created?: number;
	    object?: string;
	    provider_name?: string;
	    provider_type?: string;
	    input?: string[];
	    output?: string[];
	
	    static createFrom(source: any = {}) {
	        return new Model(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.owner = source["owner"];
	        this.created = source["created"];
	        this.object = source["object"];
	        this.provider_name = source["provider_name"];
	        this.provider_type = source["provider_type"];
	        this.input = source["input"];
	        this.output = source["output"];
	    }
	}
	export class TextRequest {
	    prompt: string;
	    images?: string[];
	    videos?: string[];
	    audios?: string[];
	    documents?: string[];
	    model: string;
	    providerId: number;
	    temperature?: number;
	    maxTokens?: number;
	    options?: Record<string, any>;
	
	    static createFrom(source: any = {}) {
	        return new TextRequest(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.prompt = source["prompt"];
	        this.images = source["images"];
	        this.videos = source["videos"];
	        this.audios = source["audios"];
	        this.documents = source["documents"];
	        this.model = source["model"];
	        this.providerId = source["providerId"];
	        this.temperature = source["temperature"];
	        this.maxTokens = source["maxTokens"];
	        this.options = source["options"];
	    }
	}
	export class VideoRequest {
	    projectId?: number;
	    prompt: string;
	    images?: string[];
	    videos?: string[];
	    audios?: string[];
	    model: string;
	    providerId: number;
	    duration?: string;
	    resolution?: string;
	    options?: Record<string, any>;
	
	    static createFrom(source: any = {}) {
	        return new VideoRequest(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.projectId = source["projectId"];
	        this.prompt = source["prompt"];
	        this.images = source["images"];
	        this.videos = source["videos"];
	        this.audios = source["audios"];
	        this.model = source["model"];
	        this.providerId = source["providerId"];
	        this.duration = source["duration"];
	        this.resolution = source["resolution"];
	        this.options = source["options"];
	    }
	}

}

export namespace app {
	
	export class UpdateInfo {
	    hasUpdate: boolean;
	    latestVersion: string;
	    currentVersion: string;
	    releaseURL: string;
	    releaseNotes: string;
	    error?: string;
	
	    static createFrom(source: any = {}) {
	        return new UpdateInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.hasUpdate = source["hasUpdate"];
	        this.latestVersion = source["latestVersion"];
	        this.currentVersion = source["currentVersion"];
	        this.releaseURL = source["releaseURL"];
	        this.releaseNotes = source["releaseNotes"];
	        this.error = source["error"];
	    }
	}

}

export namespace database {
	
	export class Asset {
	    id: number;
	    projectId: number;
	    type: string;
	    path: string;
	    url: string;
	    isUserProvided: boolean;
	    md5: string;
	    // Go type: time
	    createdAt: any;
	    // Go type: time
	    updatedAt: any;
	
	    static createFrom(source: any = {}) {
	        return new Asset(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.projectId = source["projectId"];
	        this.type = source["type"];
	        this.path = source["path"];
	        this.url = source["url"];
	        this.isUserProvided = source["isUserProvided"];
	        this.md5 = source["md5"];
	        this.createdAt = this.convertValues(source["createdAt"], null);
	        this.updatedAt = this.convertValues(source["updatedAt"], null);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class ModelProvider {
	    id: number;
	    name: string;
	    type: string;
	    apiKey: string;
	    baseUrl: string;
	    // Go type: time
	    createdAt: any;
	    // Go type: time
	    updatedAt: any;
	
	    static createFrom(source: any = {}) {
	        return new ModelProvider(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.name = source["name"];
	        this.type = source["type"];
	        this.apiKey = source["apiKey"];
	        this.baseUrl = source["baseUrl"];
	        this.createdAt = this.convertValues(source["createdAt"], null);
	        this.updatedAt = this.convertValues(source["updatedAt"], null);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class Project {
	    id: number;
	    name: string;
	    description: string;
	    workflow: string;
	    coverImage: string;
	    // Go type: time
	    createdAt: any;
	    // Go type: time
	    updatedAt: any;
	
	    static createFrom(source: any = {}) {
	        return new Project(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.name = source["name"];
	        this.description = source["description"];
	        this.workflow = source["workflow"];
	        this.coverImage = source["coverImage"];
	        this.createdAt = this.convertValues(source["createdAt"], null);
	        this.updatedAt = this.convertValues(source["updatedAt"], null);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}

}

