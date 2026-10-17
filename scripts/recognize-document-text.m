#import <Foundation/Foundation.h>
#import <Vision/Vision.h>
int main(int argc, const char *argv[]) {
 @autoreleasepool {
  if(argc<2)return 2;
  VNRecognizeTextRequest *request=[VNRecognizeTextRequest new];
  request.recognitionLevel=VNRequestTextRecognitionLevelAccurate;
  request.recognitionLanguages=@[@"ko-KR",@"en-US"];
  request.usesLanguageCorrection=YES;
  VNImageRequestHandler *handler=[[VNImageRequestHandler alloc] initWithURL:[NSURL fileURLWithPath:[NSString stringWithUTF8String:argv[1]]] options:@{}];
  NSError *error=nil;
  if(![handler performRequests:@[request] error:&error]){fprintf(stderr,"%s",error.localizedDescription.UTF8String);return 1;}
  for(VNRecognizedTextObservation *observation in request.results){VNRecognizedText *text=[[observation topCandidates:1] firstObject];if(text)puts(text.string.UTF8String);}
 }
 return 0;
}
